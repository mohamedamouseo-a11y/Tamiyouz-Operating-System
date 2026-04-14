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
  const reviewTasks = tasks.filter(t => t.status === 'review');
  const todoTasks = tasks.filter(t => t.status === 'todo');
  const totalHours = tasks.reduce((sum, t) => sum + (Number(t.actualHours) || 0), 0);
  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

  // Group tasks by client
  const clientBreakdown: Array<{ client: string; done: number; inProgress: number; pending: number; hours: number }> = [];
  const clientMap = new Map<string, { done: number; inProgress: number; pending: number; hours: number }>();
  for (const t of tasks) {
    const client = t.clientName || 'Unassigned';
    if (!clientMap.has(client)) clientMap.set(client, { done: 0, inProgress: 0, pending: 0, hours: 0 });
    const entry = clientMap.get(client)!;
    if (t.status === 'done') entry.done++;
    else if (t.status === 'in_progress') entry.inProgress++;
    else entry.pending++;
    entry.hours += Number(t.actualHours) || 0;
  }
  for (const [client, data] of clientMap) {
    clientBreakdown.push({ client, ...data });
  }
  clientBreakdown.sort((a, b) => (b.done + b.inProgress) - (a.done + a.inProgress));

  // Build task list (max 30 most relevant tasks)
  const orderedTasks = [...completedTasks, ...inProgressTasks, ...reviewTasks, ...todoTasks];
  const taskList = orderedTasks.slice(0, 30).map(t => ({
    title: (t.title || 'Untitled').substring(0, 80),
    client: t.clientName || 'Unassigned',
    hours: Number(t.actualHours) || 0,
    status: t.status,
  }));

  // Smart insight
  let insight = '';
  if (totalTasks === 0) {
    insight = 'No tasks recorded for this date.';
  } else if (completionRate >= 80) {
    insight = `Excellent performance! ${completionRate}% completion rate.`;
  } else if (completionRate >= 50) {
    insight = `Good progress. Over half of tasks completed.`;
  } else if (completedTasks.length > 0) {
    insight = `Needs follow-up. Only ${completionRate}% completion rate.`;
  } else if (inProgressTasks.length > 0) {
    insight = `Tasks are in progress, none completed yet.`;
  } else {
    insight = `All tasks are pending.`;
  }

  // Store structured JSON as summary
  const structuredData = {
    version: 2,
    stats: {
      total: totalTasks,
      done: completedTasks.length,
      inProgress: inProgressTasks.length,
      review: reviewTasks.length,
      todo: todoTasks.length,
      completionRate,
      totalHours: parseFloat(totalHours.toFixed(2)),
    },
    insight,
    tasks: taskList,
    clientBreakdown: clientBreakdown.length > 1 ? clientBreakdown : [],
    remainingTasks: Math.max(0, orderedTasks.length - 30),
  };

  const summary = JSON.stringify(structuredData);

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
