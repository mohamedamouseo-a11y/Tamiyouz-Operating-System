import { invokeLLM } from './_core/llm';
import {
  getEmployeeById,
  getTasksByEmployee,
  createOrUpdateDailyReport,
  getAllEmployees,
  getTaskStats,
  getEmployeesByDepartment,
  createAlert,
} from './db';
import { TRPCError } from '@trpc/server';

export async function generateDailyReport(employeeId: number, date: string) {
  const employee = await getEmployeeById(employeeId);
  if (!employee) {
    throw new TRPCError({ code: 'NOT_FOUND', message: `Employee ${employeeId} not found.` });
  }

  const tasks = await getTasksByEmployee(employeeId, date);
  const completedTasks = tasks.filter(t => t.status === 'done');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');

  const completedStr = completedTasks.length > 0
    ? completedTasks.map(t => `- ${t.title} (${t.actualHours || 0}h) - Client: ${t.clientName || 'N/A'}`).join('\n')
    : 'No tasks completed.';

  const inProgressStr = inProgressTasks.length > 0
    ? inProgressTasks.map(t => `- ${t.title} (${t.actualHours || 0}h)`).join('\n')
    : 'No tasks in progress.';

  const prompt = `Generate a daily work report for ${employee.name} on ${date}.

Tasks completed:
${completedStr}

Tasks in progress:
${inProgressStr}

Provide a brief professional summary. Then list tasks in a table format:
Date | Client | Task Description | Hours Spent | Status

Match the language of the data (Arabic names stay Arabic).`;

  const result = await invokeLLM({
    messages: [
      {
        role: 'system',
        content: 'You are a professional work report generator for Tamiyouz digital marketing agency (التميز ليس مهارة بل موقف). Generate concise, professional daily reports. Respond in the same language as the data.'
      },
      { role: 'user', content: prompt }
    ]
  });

  const summary = (result.choices[0]?.message?.content as string) || 'Report generation failed.';
  const totalHours = tasks.reduce((sum, t) => sum + (Number(t.actualHours) || 0), 0);

  await createOrUpdateDailyReport({
    employeeId,
    date,
    totalHours: String(parseFloat(totalHours.toFixed(2))),
    tasksCompleted: completedTasks.length,
    tasksInProgress: inProgressTasks.length,
    summary,
    status: 'generated',
    generatedAt: new Date(),
  });

  return {
    summary,
    totalHours: parseFloat(totalHours.toFixed(2)),
    tasksCompleted: completedTasks.length,
    tasksInProgress: inProgressTasks.length,
  };
}

export async function analyzePerformance(
  type: 'employee' | 'department' | 'company',
  targetId: number | undefined,
  employeeIds: number[] | undefined,
  startDate?: string,
  endDate?: string,
): Promise<string> {
  let dataContext = '';
  let entityName = '';

  const today = new Date().toISOString().split('T')[0];
  const sDate = startDate || '2024-01-01';
  const eDate = endDate || today;

  if (type === 'employee' && targetId) {
    const employee = await getEmployeeById(targetId);
    if (!employee) throw new TRPCError({ code: 'NOT_FOUND', message: 'Employee not found.' });
    entityName = employee.name;
    const stats = await getTaskStats([targetId], sDate, eDate);
    dataContext = `Employee: ${employee.name} (${employee.position || 'N/A'})
Department: ${employee.departmentName || 'N/A'}
Period: ${sDate} to ${eDate}
Total Tasks: ${stats.totalTasks}
Tasks by Status: ${JSON.stringify(stats.tasksByStatus)}
Total Hours Logged: ${stats.totalActualHours}`;
  } else if (type === 'department' && targetId) {
    const deptEmployees = await getEmployeesByDepartment(targetId);
    entityName = deptEmployees[0]?.departmentId ? `Department #${targetId}` : 'Department';
    const stats = await getTaskStats(employeeIds, sDate, eDate);
    dataContext = `Department employees: ${deptEmployees.map(e => e.name).join(', ')}
Period: ${sDate} to ${eDate}
Total Tasks: ${stats.totalTasks}
Tasks by Status: ${JSON.stringify(stats.tasksByStatus)}
Total Hours Logged: ${stats.totalActualHours}`;
  } else {
    entityName = 'Company';
    const allEmployees = await getAllEmployees();
    const stats = await getTaskStats(employeeIds, sDate, eDate);
    dataContext = `Total Employees: ${allEmployees.length}
Period: ${sDate} to ${eDate}
Total Tasks: ${stats.totalTasks}
Tasks by Status: ${JSON.stringify(stats.tasksByStatus)}
Total Hours Logged: ${stats.totalActualHours}`;
  }

  const result = await invokeLLM({
    messages: [
      {
        role: 'system',
        content: 'You are an AI performance analyst for Tamiyouz digital marketing agency. Provide insightful, data-driven analysis with actionable recommendations. Respond in markdown. Use the same language as the data.'
      },
      {
        role: 'user',
        content: `Analyze performance for ${entityName} (${sDate} to ${eDate}):\n\n${dataContext}\n\nProvide insights on productivity, trends, bottlenecks, and recommendations.`
      }
    ]
  });

  return (result.choices[0]?.message?.content as string) || 'Analysis generation failed.';
}

export async function checkDeadlines(): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  const allEmployees = await getAllEmployees();

  for (const employee of allEmployees) {
    if (!employee.isActive) continue;
    const tasks = await getTasksByEmployee(employee.id);

    for (const task of tasks) {
      // Check overdue: task date is before today and not done
      if (task.date < today && task.status !== 'done' && task.status !== 'review') {
        await createAlert({
          employeeId: employee.id,
          type: 'deadline_missed',
          title: `Task "${task.title}" is past due`,
          message: `Task "${task.title}" for ${employee.name} was expected by ${task.date} but is still "${task.status}".`,
          severity: 'critical',
          targetRole: 'team_leader',
        });
      }

      // Check over-estimated hours
      if (task.estimatedHours && task.actualHours &&
          Number(task.actualHours) > Number(task.estimatedHours) * 1.5) {
        await createAlert({
          employeeId: employee.id,
          type: 'overdue_task',
          title: `Task "${task.title}" exceeds estimated hours`,
          message: `${employee.name} spent ${task.actualHours}h on "${task.title}" (estimated ${task.estimatedHours}h).`,
          severity: 'warning',
          targetRole: 'team_leader',
        });
      }
    }
  }
}
