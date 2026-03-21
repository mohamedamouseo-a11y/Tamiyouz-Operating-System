import type { InsertArticle } from "./helpCenterDb";

export type HelpCenterSeedArticle = InsertArticle;

export const helpCenterSeedArticles: HelpCenterSeedArticle[] = [
  {
    title: "Getting Started with Tamiyouz TOS",
    titleAr: "البدء باستخدام Tamiyouz TOS",
    slug: "getting-started-with-tamiyouz-tos",
    category: "getting-started",
    tags: ["login", "dashboard", "roles", "navigation", "onboarding"],
    isPublished: true,
    isPinned: true,
    content: `# Getting Started with Tamiyouz TOS

Tamiyouz TOS is the operating workspace used to coordinate people, clients, tasks, reports, and performance across the agency. Your first week in the system should focus on three things: signing in correctly, understanding what appears on your dashboard, and learning what actions are available for your role. Once those three areas are clear, the rest of the workflow becomes much easier.

## Step 1: Sign in safely

Use your assigned account and sign in through the normal company login flow. After successful authentication, the system stores your session in a secure cookie named \\"tos_session\\". If you close the browser and return later, you may remain signed in until the session expires or you sign out manually from the profile menu. If you cannot sign in, verify that your user account exists and that your role has been assigned by an administrator.

## Step 2: Read the dashboard correctly

The dashboard is your starting point for daily work. It is designed to surface the information most relevant to your role.

- Employees usually focus on **My Tasks**, **My Reports**, and alerts.
- Team leaders and directors typically see broader operational sections such as **Employees**, **Clients**, **Daily Reports**, and **Analytics**.
- Admin and super admin users also manage organizational setup, Trello settings, and user-role management.

When you open the dashboard, review the sidebar first. It tells you which sections are available to you. If a page is missing, that normally means your role does not have access rather than a system error.

## Step 3: Learn the daily workflow

A simple operating rhythm helps new users adopt the system quickly:

1. Open the dashboard and review alerts.
2. Check your assigned tasks or the team task board.
3. Update task progress during the day.
4. Submit or review daily reports before the workday ends.
5. Use analytics and reports to follow up on bottlenecks, approvals, and missed deadlines.

## Understanding role permissions

Tamiyouz TOS uses role-based access control. Permissions are not only about visibility; they also define who can create, edit, approve, or manage operational records.

- **employee**: manage personal work items and submit daily updates.
- **team_leader**: coordinate team work, create operational records, and review team activity.
- **director**: monitor departments and approve broader execution.
- **cmo / ceo**: access high-level visibility across teams and performance.
- **admin / super_admin**: manage system configuration, users, and full operational setup.

If you are ever unsure whether you should be able to perform an action, check your current role first. Many permission-related questions are solved by confirming whether the logged-in account is the correct one.

## Practical tips for new users

- Keep your browser tab open during active work to avoid losing context.
- Refresh the page after a major admin change such as a new role assignment.
- Use consistent names when creating records so analytics and reporting stay clean.
- Open the Help Center whenever you need feature instructions instead of guessing.

A good first-day checklist is: sign in, confirm your role, open your dashboard, review the sidebar, and complete one full task-to-report cycle. After that, the system becomes much more intuitive.
`,
    contentAr: `# البدء باستخدام Tamiyouz TOS

Tamiyouz TOS هو مساحة التشغيل الأساسية لإدارة العملاء والموظفين والمهام والتقارير داخل الشركة. أول شيء يجب أن تتأكد منه هو تسجيل الدخول الصحيح، ثم فهم ما يظهر لك في لوحة التحكم، وبعدها معرفة الصلاحيات المرتبطة بدورك. عندما تفهم هذه النقاط الثلاث يصبح التعامل مع باقي النظام أسهل بكثير.

## الخطوة 1: تسجيل الدخول بشكل صحيح

استخدم الحساب المخصص لك وسجّل الدخول من خلال بوابة الدخول المعتادة. بعد نجاح الدخول يحفظ النظام جلسة العمل في Cookie باسم **tos_session**. إذا أغلقت المتصفح قد تبقى الجلسة فعالة لفترة، لكن يفضل دائمًا تسجيل الخروج عند الانتهاء من جهاز مشترك. إذا واجهت مشكلة في الدخول فتأكد أن حسابك تم إنشاؤه وأن الدور الوظيفي تم تعيينه من قبل المسؤول.

## الخطوة 2: قراءة لوحة التحكم

لوحة التحكم هي نقطة البداية اليومية. كل مستخدم يرى أجزاء مختلفة حسب دوره:

- الموظف يركز غالبًا على **مهامي** و **تقاريري** والتنبيهات.
- قائد الفريق أو المدير يرى صفحات أوسع مثل الموظفين والعملاء والتقارير اليومية والتحليلات.
- المشرف أو السوبر أدمن لديه أيضًا إمكانية إدارة الإعدادات والمستخدمين وربط الأنظمة.

أول ما تفتح النظام، راجع الشريط الجانبي. الصفحات الظاهرة لك تعكس الصلاحيات الممنوحة لحسابك. إذا لم تجد صفحة معينة فهذا غالبًا بسبب الصلاحية وليس عطلًا في النظام.

## الخطوة 3: دورة العمل اليومية

أفضل طريقة لاستخدام النظام هي اتباع روتين واضح:

1. افتح لوحة التحكم وراجع التنبيهات.
2. راجع المهام المسندة لك أو لفريقك.
3. حدّث حالة المهام أثناء اليوم.
4. أرسل التقرير اليومي أو راجع تقارير الفريق قبل نهاية اليوم.
5. استخدم التحليلات والتقارير لمتابعة التأخير أو الموافقات أو الاختناقات.

## فهم الصلاحيات

يعتمد النظام على الأدوار الوظيفية، وكل دور يحدد ما يمكنك رؤيته أو تعديله أو اعتماده:

- **employee**: متابعة العمل الشخصي وإرسال التقرير اليومي.
- **team_leader**: تنسيق مهام الفريق ومراجعة الأداء.
- **director**: متابعة الأقسام والإشراف على التنفيذ.
- **cmo / ceo**: رؤية أوسع للأداء والتقارير على مستوى أعلى.
- **admin / super_admin**: إدارة النظام والإعدادات والمستخدمين بالكامل.

## نصائح عملية

- حافظ على فتح التبويب أثناء العمل لتسهيل المتابعة.
- حدّث الصفحة بعد أي تغيير إداري كبير مثل تعديل الدور الوظيفي.
- استخدم أسماء واضحة وثابتة في السجلات حتى تبقى التقارير دقيقة.
- ارجع دائمًا إلى مركز المساعدة بدلًا من التخمين.

أفضل بداية للمستخدم الجديد هي: تسجيل الدخول، التأكد من الدور، مراجعة الشريط الجانبي، ثم تنفيذ دورة كاملة من المهمة إلى التقرير اليومي.
`,
  },
  {
    title: "Clients Module: Add, Update, and Organize Client Work",
    titleAr: "وحدة العملاء: إضافة العميل وتنظيم أعماله",
    slug: "clients-module-add-update-and-organize-client-work",
    category: "clients",
    tags: ["clients", "services", "integrations", "contact info", "accounts"],
    isPublished: true,
    isPinned: true,
    content: `# Clients Module: Add, Update, and Organize Client Work

The Clients module is the master record for every account your team serves. A clean client record improves task assignment, reporting quality, and coordination between service teams. Before creating work items or linking operational activity to a client, make sure the client profile is complete and standardized.

## What belongs in a client record

At minimum, every client should include:

- Client name in English.
- Optional Arabic display name.
- Primary contact email.
- Primary contact phone.
- Industry or service segment.
- Active status.

This information should be kept accurate because many team members will rely on it during execution, reporting, and approvals.

## How to add a new client

1. Open the **Clients** page.
2. Select **Add Client**.
3. Enter the official client name exactly as the team uses it in communication.
4. Add the Arabic name if your reporting or coordination requires bilingual display.
5. Save the contact email and phone of the main decision-maker or day-to-day coordinator.
6. Set the industry so reports and internal discussions remain clear.
7. Confirm the client is marked as active.

A useful habit is to create the client record before adding campaign tasks. This keeps all related work tied to one clear account identity.

## Editing client details

Client information changes often. Contacts switch roles, numbers change, and the scope of work evolves. Update the client record as soon as a change is confirmed.

Typical edits include:

- Replacing an outdated email or phone number.
- Updating the industry label for cleaner segmentation.
- Correcting naming inconsistencies so reports remain readable.
- Marking a client inactive when service is paused or closed.

Avoid creating duplicate records for the same client unless there is a genuine business reason such as a separate legal entity.

## Assigning services and operational context

Even if your deployment handles services through related task workflows, the client page should still reflect the account’s operating context. In practice, teams commonly use tags, naming conventions, and linked tasks to represent services such as SEO, content, reporting, or technical work. Keep this consistent across the account so everyone understands what is being delivered.

A good naming pattern is to keep the client name fixed and mention the service type inside task titles or internal notes. This helps analytics stay clean while still showing service-specific execution.

## Managing integrations for client work

When a client depends on external tools such as Trello or other delivery systems, document the operational setup before work begins. The client record itself should remain the clear reference point for who the account belongs to, while integration-specific credentials or board mappings should be maintained only in approved settings areas.

Best practice:

- Confirm which board, workspace, or external system belongs to the client.
- Use consistent naming between the client record and the external board.
- Keep credentials in secured settings pages, not in free-text notes.
- Test the workflow with one or two sample tasks before full rollout.

## Tips for reliable client operations

- Use one source of truth for each client name.
- Keep contact data short and practical.
- Review inactive clients monthly.
- Align service labels with the same wording used in reports.

A strong client record reduces confusion across onboarding, task assignment, and reporting. When the Clients module is maintained well, everything downstream becomes easier.
`,
    contentAr: `# وحدة العملاء: إضافة العميل وتنظيم أعماله

وحدة العملاء هي السجل الأساسي لكل عميل تعمل عليه الشركة. كلما كان سجل العميل واضحًا ومكتملًا، أصبح من السهل ربط المهام به، وإخراج تقارير دقيقة، وتنسيق العمل بين أعضاء الفريق. قبل البدء في تنفيذ أي أعمال تخص العميل، تأكد أن ملفه موجود ومحدّث.

## ما الذي يجب أن يحتويه سجل العميل؟

يفضل أن يتضمن كل سجل عميل البيانات التالية:

- اسم العميل بالإنجليزية.
- الاسم بالعربية إن كان مطلوبًا.
- البريد الإلكتروني الأساسي.
- رقم الهاتف الأساسي.
- المجال أو الصناعة.
- حالة النشاط: فعال أو غير فعال.

## خطوات إضافة عميل جديد

1. افتح صفحة **Clients**.
2. اضغط **Add Client**.
3. اكتب اسم العميل بالشكل المعتمد داخل الشركة.
4. أضف الاسم العربي عند الحاجة.
5. سجّل البريد ورقم الهاتف الخاص بجهة التواصل الرئيسية.
6. اختر المجال المناسب.
7. تأكد أن حالة العميل **Active** إذا كان الحساب يعمل حاليًا.

أفضل ممارسة هي إنشاء سجل العميل أولًا، ثم ربط المهام أو التقارير به لاحقًا، حتى تكون كل الأعمال منظمة تحت حساب واضح.

## تعديل بيانات العميل

بيانات العميل قد تتغير باستمرار، مثل تغيير جهة التواصل أو تحديث رقم الهاتف أو تعديل نطاق الخدمة. لذلك يجب تعديل السجل بمجرد تأكيد المعلومة الجديدة.

أمثلة للتعديلات الشائعة:

- تحديث البريد الإلكتروني أو الهاتف.
- تعديل المجال أو نوع النشاط.
- تصحيح الاسم إذا كان مكتوبًا بشكل غير موحّد.
- جعل العميل غير نشط عند توقف التعاون أو إيقاف الخدمة.

تجنب إنشاء سجل مكرر لنفس العميل إلا إذا كان هناك سبب إداري واضح.

## ربط الخدمات وسياق العمل

حتى لو كانت الخدمات تُدار من خلال المهام أو اللوحات التشغيلية، يجب أن يظل سجل العميل هو المرجع الأساسي للحساب. يمكن تمثيل الخدمات من خلال أسماء المهام أو الوسوم أو طريقة تنظيم العمل، لكن اسم العميل يجب أن يكون ثابتًا وواضحًا.

## إدارة الـ Integrations الخاصة بالعميل

إذا كان العمل يعتمد على Trello أو أي نظام خارجي، فقم بتوثيق الإعداد التشغيلي بشكل واضح. اجعل سجل العميل مرجعًا لهوية الحساب، واحتفظ ببيانات الربط أو الـ credentials في صفحات الإعدادات المخصصة وليس داخل ملاحظات حرة.

أفضل ممارسات:

- تأكد من اسم اللوحة أو النظام المرتبط بالعميل.
- وحّد التسمية بين العميل والنظام الخارجي.
- لا تحفظ بيانات حساسة في الحقول النصية العامة.
- اختبر الربط بمهمتين أو ثلاث قبل بدء العمل الكامل.

## نصائح مهمة

- استخدم اسمًا موحدًا لكل عميل.
- حدّث بيانات التواصل باستمرار.
- راجع العملاء غير النشطين بشكل دوري.
- اجعل تسمية الخدمات متوافقة مع نفس اللغة المستخدمة في التقارير.

عندما تكون وحدة العملاء منظمة، يصبح من الأسهل متابعة التنفيذ وقياس الأداء وإخراج تقارير واضحة.
`,
  },
  {
    title: "Employees Module: Profiles, Departments, and User Links",
    titleAr: "وحدة الموظفين: الملفات والأقسام وربط الحسابات",
    slug: "employees-module-profiles-departments-and-user-links",
    category: "employees",
    tags: ["employees", "departments", "user accounts", "positions", "team structure"],
    isPublished: true,
    isPinned: false,
    content: `# Employees Module: Profiles, Departments, and User Links

The Employees module is where operational structure becomes visible. It connects a person’s profile, department, position, board assignment, and user account relationship. Keeping this module organized is essential for permission-based access, reporting, and task visibility.

## What an employee profile should contain

A complete employee record usually includes:

- Full employee name.
- Optional Arabic name.
- Work email and phone.
- Department assignment.
- Position or job title.
- Optional Trello board data if the employee uses synced task boards.
- Active or inactive status.

These fields affect more than display. For example, department assignment influences which records managers can see, and linked user accounts determine whether the employee can access the system under the correct identity.

## How to add an employee

1. Go to **Employees**.
2. Choose **Add Employee**.
3. Enter the employee name exactly as it should appear in reports.
4. Select the department carefully. This is one of the most important fields.
5. Add position, email, and phone.
6. Save the record and confirm it appears under the correct department.

If the person will later use Trello-based workflows, you can also save board information so future synchronization is easier.

## Editing employee details

Employee records need updates whenever a person changes department, role, title, or contact information. Make changes promptly so reporting remains accurate. A small mismatch, such as the wrong department, can create confusion in both visibility and analytics.

Common updates include:

- Moving an employee to a new department.
- Updating their position title.
- Saving a new Trello board mapping.
- Marking the employee inactive when they leave or pause work.

Avoid deleting historical employee records unless you are sure no previous reporting needs them. In most cases, inactive status is the better option.

## Assigning employees to departments

Departments create the backbone of visibility. Team leaders and directors often see data based on department membership, so correct assignment matters. If a person works across multiple functions, agree internally on the primary operational department used for reporting.

## Linking an employee to a user account

A user account and an employee profile are not the same thing. The user account handles authentication and role permissions, while the employee profile represents the operational record. Linking them is important because it allows the system to know which employee belongs to the logged-in user.

Best practice:

- Create the employee profile first.
- Create or confirm the user account exists.
- Link the user to the employee record from the admin area.
- Test sign-in to ensure the correct pages and data appear.

## Quality tips

- Use consistent names across employee and user records.
- Review inactive employees regularly.
- Do not leave department assignment blank.
- Re-check board mapping after changing Trello workflows.

A well-maintained Employees module leads to better permissions, cleaner analytics, and fewer access issues for the whole team.
`,
    contentAr: `# وحدة الموظفين: الملفات والأقسام وربط الحسابات

وحدة الموظفين هي المكان الذي يربط بين الشخص الفعلي داخل الشركة وبين بياناته التشغيلية داخل النظام. من خلال هذه الوحدة يتم تحديد اسم الموظف، القسم، المنصب، وربط الحساب المستخدم لتسجيل الدخول. تنظيم هذه الوحدة بشكل جيد مهم جدًا للصلاحيات، والتقارير، ورؤية المهام.

## ما الذي يجب أن يحتويه ملف الموظف؟

يفضل أن يحتوي سجل الموظف على:

- الاسم الكامل.
- الاسم بالعربية إن وجد.
- البريد الإلكتروني ورقم الهاتف.
- القسم التابع له.
- المسمى الوظيفي.
- بيانات لوحة Trello إذا كانت مستخدمة.
- حالة النشاط.

هذه البيانات ليست للعرض فقط، بل تؤثر أيضًا على من يرى ماذا داخل النظام.

## خطوات إضافة موظف

1. افتح صفحة **Employees**.
2. اضغط **Add Employee**.
3. أدخل الاسم كما يجب أن يظهر في التقارير.
4. اختر القسم بدقة، لأنه من أهم الحقول.
5. أضف المنصب والبريد والهاتف.
6. احفظ السجل وتأكد أنه ظهر ضمن القسم الصحيح.

إذا كان الموظف سيعمل عبر Trello لاحقًا، يمكن حفظ بيانات اللوحة من البداية أو إضافتها بعد ذلك.

## تعديل بيانات الموظف

يجب تعديل بيانات الموظف فور حدوث أي تغيير مثل الانتقال لقسم آخر أو تغيير المنصب أو تحديث بيانات الاتصال. وجود قسم خاطئ أو اسم غير موحد قد يسبب مشاكل في الصلاحيات وفي التحليلات.

أمثلة للتعديلات:

- نقل الموظف إلى قسم جديد.
- تحديث المسمى الوظيفي.
- تعديل لوحة Trello أو رابطها.
- تحويل الحالة إلى غير نشط عند توقف العمل.

## ربط الموظف بحساب المستخدم

حساب المستخدم خاص بتسجيل الدخول والصلاحيات، بينما ملف الموظف هو السجل التشغيلي. الربط بينهما ضروري حتى يعرف النظام من هو الموظف المرتبط بالحساب الحالي.

أفضل طريقة:

- أنشئ ملف الموظف أولًا.
- تأكد أن حساب المستخدم موجود.
- اربط المستخدم بالموظف من إدارة المستخدمين.
- جرّب تسجيل الدخول للتأكد من ظهور البيانات الصحيحة.

## نصائح تنظيمية

- وحّد الاسم بين سجل الموظف وسجل المستخدم.
- راجع الموظفين غير النشطين بشكل دوري.
- لا تترك القسم فارغًا.
- بعد تعديل إعدادات Trello تأكد من صحة الربط مرة أخرى.

عندما تكون وحدة الموظفين محدثة ومنظمة، تصبح الصلاحيات أوضح والتقارير أدق ومتابعة الأداء أسهل.
`,
  },
  {
    title: "Tasks Module: Create, Assign, and Track Work",
    slug: "tasks-module-create-assign-and-track-work",
    category: "tasks",
    tags: ["tasks", "assignment", "progress", "daily reports", "status"],
    isPublished: true,
    isPinned: false,
    content: `# Tasks Module: Create, Assign, and Track Work

The Tasks module is the day-to-day execution engine of Tamiyouz TOS. It connects work items to employees, optionally links them to clients, and stores status, dates, and time data used in reporting. If teams use consistent task habits, leadership gets better visibility and employees spend less time explaining what happened.

## Creating a task properly

A good task is specific, assigned, and date-bound. When creating a task, always define:

- The responsible employee.
- The related client when relevant.
- A clear task title.
- A brief description or scope.
- The target date.
- The starting status.
- Estimated hours if planning accuracy matters.

Avoid vague titles like “SEO work” or “Client edits.” Better examples are “Update homepage meta titles for Client X” or “Prepare monthly reporting template for March.” Specific task names make reporting far more useful.

## Assigning tasks to employees

When a team leader or manager assigns work, the task should reflect ownership clearly. Tamiyouz TOS is designed so each task belongs to one employee record even if multiple people collaborate around it. If work is shared, break it into multiple smaller tasks instead of one oversized card.

This approach improves:

- Accountability.
- Performance analysis.
- Approval and review flow.
- Accuracy of hours logged.

## Understanding task status

The common statuses are:

- **todo**: work has been created but not started.
- **in_progress**: execution has started.
- **review**: work is ready for managerial or quality review.
- **done**: work is complete.

Use status changes honestly. Do not move a task to done just because the draft exists if the client approval or internal QA is still pending. That creates misleading reports.

## Tracking progress during the day

Employees should update tasks as work progresses. Team leaders should also encourage status hygiene, especially before the end of the day. A delayed update often creates reporting gaps that are harder to fix later.

A strong team habit is:

1. Start the task and move it to **in_progress**.
2. Update actual hours when meaningful work is complete.
3. Move the task to **review** if another person must validate it.
4. Close it as **done** only when the deliverable is actually complete.

## Linking tasks to daily reports

Daily reports summarize the task activity attached to an employee on a given date. That means tasks should be assigned to the correct day and updated before reports are generated or approved. If task dates are inaccurate, the report will also be inaccurate.

## Tips for cleaner reporting

- Keep one business outcome per task.
- Use client links consistently.
- Prefer smaller tasks over oversized mixed tasks.
- Review task status before report generation.
- Log actual hours honestly so analytics become useful over time.

When the Tasks module is used carefully, managers can read progress at a glance and employees spend less time reconstructing their day from memory.
`,
  },
  {
    title: "Trello Integration Setup and Sync Guide",
    titleAr: "دليل إعداد تكامل Trello والمزامنة",
    slug: "trello-integration-setup-and-sync-guide",
    category: "trello-integration",
    tags: ["trello", "api key", "api token", "sync", "boards", "cards"],
    isPublished: true,
    isPinned: true,
    content: `# Trello Integration Setup and Sync Guide

The Trello integration allows Tamiyouz TOS to connect operational work in Trello with internal task tracking. This is especially useful when team execution already happens on Trello boards but managers still want reporting, monitoring, and visibility inside TOS.

## What you need before setup

Before opening the settings page, prepare the following:

- A Trello account with access to the relevant workspace or boards.
- Permission to generate an API key and token.
- The board IDs or board URLs used by the team or employee.
- Admin or super admin access inside Tamiyouz TOS.

## Step 1: Get your Trello API key and token

1. Open **https://trello.com/app-key** while logged into Trello.
2. Copy the **API Key** shown on the page.
3. On the same page, generate a **Token**.
4. Approve the requested access.
5. Copy the token securely.

Treat both values as credentials. Share them only with authorized system administrators.

## Step 2: Save the credentials in TOS

1. Sign in with an account that has admin-level access.
2. Open **Settings > Trello**.
3. Paste the API key.
4. Paste the API token.
5. Save the settings.
6. Run the connection test if your deployment exposes that action.

If the credentials are valid, the system can start reading boards and cards through the Trello API.

## Step 3: Confirm board structure

Tamiyouz TOS works best when Trello boards use a consistent workflow. Even if different teams have their own naming style, status movement should remain understandable. Typical lists often map to planning, active execution, review, and completed work.

## Step 4: How board and card sync works

During synchronization, the system reads the Trello board and translates cards into task records. Depending on your operational setup, cards may be tied to a specific employee board. The goal is to keep execution traceable without forcing the team to abandon Trello.

Good sync hygiene includes:

- Consistent card titles.
- Clear due dates.
- Predictable list usage.
- Stable board ownership.

## Step 5: Trigger a manual sync

If new cards do not appear immediately, open the Trello settings page and run **Sync Now** if the action is available in your deployment. Manual sync is useful after major board updates, board reassignments, or initial setup.

## Troubleshooting common issues

### Invalid key or token

Re-open the Trello app-key page, generate a fresh token, and save both values again.

### Cards are not appearing

Check that the employee or target board is mapped correctly and that the Trello account has access to the board.

### Wrong tasks are syncing

Verify that the correct board is attached to the correct employee or workflow. Similar board names can cause confusion.

### Sync worked before and stopped

The token may have expired or been revoked. Re-authorize it and run a fresh sync.

## Practical tips

- Use one trusted Trello account for operational integration.
- Standardize board names for easier administration.
- Test with one board before rolling out across the whole team.
- Re-run manual sync after any major Trello restructuring.

A careful initial setup saves time later and makes Trello-based reporting inside TOS far more dependable.
`,
    contentAr: `# دليل إعداد تكامل Trello والمزامنة

تكامل Trello يتيح ربط العمل التشغيلي الموجود على Trello مع المتابعة والتقارير داخل Tamiyouz TOS. هذا مفيد جدًا إذا كان التنفيذ اليومي يتم عبر لوحات Trello لكن الإدارة تحتاج رؤية واضحة داخل النظام.

## ما الذي تحتاجه قبل الإعداد؟

قبل البدء تأكد من توفر:

- حساب Trello لديه صلاحية الوصول إلى اللوحات المطلوبة.
- إمكانية إنشاء API Key و Token.
- معرفة اللوحة أو اللوحات المستخدمة فعليًا.
- صلاحية Admin أو Super Admin داخل النظام.

## الخطوة 1: الحصول على API Key و Token

1. افتح الرابط **https://trello.com/app-key** وأنت مسجل الدخول إلى Trello.
2. انسخ **API Key** الظاهر في الصفحة.
3. أنشئ **Token** من نفس الصفحة.
4. وافق على الصلاحيات المطلوبة.
5. انسخ الـ Token واحفظه بشكل آمن.

اعتبر هاتين القيمتين بيانات حساسة ولا تشاركهما إلا مع المسؤولين المخولين.

## الخطوة 2: حفظ البيانات داخل النظام

1. سجّل الدخول بحساب إداري.
2. افتح **Settings > Trello**.
3. الصق الـ API Key.
4. الصق الـ API Token.
5. احفظ الإعدادات.
6. اختبر الاتصال إذا كانت الخاصية متاحة.

## الخطوة 3: التأكد من هيكلة اللوحات

كلما كانت لوحات Trello منظمة بشكل واضح، كانت المزامنة أفضل. يفضل أن تكون القوائم معبرة عن مراحل العمل مثل التخطيط والتنفيذ والمراجعة والإنهاء.

## الخطوة 4: كيف تتم المزامنة؟

عند تشغيل المزامنة يقرأ النظام اللوحات والبطاقات من Trello ويحاول تحويلها إلى مهام داخلية. في كثير من الحالات تكون اللوحة مرتبطة بموظف أو بسياق تشغيلي محدد.

## الخطوة 5: تشغيل مزامنة يدوية

إذا لم تظهر البطاقات الجديدة، افتح صفحة إعدادات Trello وشغّل **Sync Now**. هذه الخطوة مفيدة جدًا بعد الإعداد الأولي أو بعد تعديل كبير في اللوحات.

## مشاكل شائعة وحلولها

### المفتاح أو التوكن غير صالح

أعد الدخول إلى صفحة app-key، وأنشئ Token جديدًا، ثم احفظ القيمتين مرة أخرى.

### البطاقات لا تظهر

تأكد أن اللوحة المرتبطة صحيحة وأن الحساب المستخدم لديه صلاحية الوصول إليها.

### تتم مزامنة مهام خاطئة

راجع ربط اللوحة بالموظف أو بالسياق التشغيلي، خصوصًا إذا كانت أسماء اللوحات متشابهة.

### المزامنة كانت تعمل ثم توقفت

قد يكون الـ Token انتهت صلاحيته أو تم سحبه. أنشئ Token جديدًا وجرب المزامنة مرة أخرى.

## نصائح عملية

- استخدم حساب Trello موثوقًا للمزامنة.
- وحّد أسماء اللوحات لتسهيل الإدارة.
- اختبر بلوحة واحدة قبل التعميم.
- أعد تشغيل المزامنة بعد أي تعديل كبير على هيكل Trello.

كلما كان الإعداد الأولي مضبوطًا، أصبحت المتابعة والتقارير داخل TOS أكثر دقة واعتمادية.
`,
  },
  {
    title: "Analytics: Reading Performance and Operational Trends",
    slug: "analytics-reading-performance-and-operational-trends",
    category: "analytics",
    tags: ["analytics", "performance", "charts", "ai analysis", "metrics"],
    isPublished: true,
    isPinned: false,
    content: `# Analytics: Reading Performance and Operational Trends

The Analytics section turns daily execution into management insight. Instead of scanning tasks one by one, leaders can use analytics to understand workload, completion trends, total hours, and where attention is needed. It is most useful when tasks and reports are updated consistently.

## What the main charts usually represent

Depending on your access level, analytics may summarize:

- Number of employees in scope.
- Tasks created or completed in the selected time range.
- Task status distribution.
- Total actual hours logged.
- Department-level or employee-level output.

These values are generated from the same operational records used elsewhere in the system. That means analytics are only as reliable as the underlying task dates, statuses, and hour entries.

## How metrics are calculated

At a practical level, the system calculates totals by reading stored tasks and grouping them by status, date, and sometimes employee visibility. Examples:

- **Total tasks** comes from the count of tasks in the selected scope.
- **Tasks by status** groups tasks into todo, in progress, review, and done.
- **Total actual hours** sums actual hours logged on matching tasks.
- **Overview cards** often combine employee counts with the current day’s operational totals.

If a number looks strange, the first thing to inspect is the data quality of the related tasks.

## Using AI analysis

The AI analysis feature is meant to turn raw counts into a short operational summary. It is especially helpful when you need a quick explanation of trends, bottlenecks, or team capacity without manually interpreting every number.

Use AI analysis when you want answers such as:

- Which team seems overloaded?
- Are completed tasks dropping over time?
- Is one employee logging unusually high hours?
- What operational recommendations can be made from recent output?

AI analysis works best when the selected date range is meaningful and the underlying records are clean.

## Recommended reading flow for managers

1. Start with overview cards.
2. Check task distribution by status.
3. Compare total hours against expected workload.
4. Narrow to a department or employee if a pattern looks unusual.
5. Use AI analysis for summary language and recommendations.

## Common interpretation mistakes

- Treating missing data as low performance.
- Comparing teams without checking whether they use the system consistently.
- Assuming high hours always mean strong output.
- Ignoring the difference between done and review-stage tasks.

## Tips for better analytics

- Standardize status updates across teams.
- Make sure actual hours are logged realistically.
- Use consistent date assignment on tasks.
- Review outliers before presenting conclusions.

Analytics become powerful when they are used as a decision-support layer, not just a dashboard to look at. The best results come from pairing the charts with regular operational follow-up.
`,
  },
  {
    title: "Departments and Workspaces: Structuring Teams for Visibility",
    slug: "departments-and-workspaces-structuring-teams-for-visibility",
    category: "other",
    tags: ["departments", "workspaces", "team leaders", "structure", "visibility"],
    isPublished: true,
    isPinned: false,
    content: `# Departments and Workspaces: Structuring Teams for Visibility

Operational visibility depends on structure. In Tamiyouz TOS, departments are the primary way to group employees and control who sees what. In practice, many teams also use the word “workspace” to describe the operational area, board, or execution context attached to that department. Whether your organization uses a formal workspace model or just an operating convention, the goal is the same: make ownership obvious.

## Why departments matter

Departments affect reporting, employee grouping, and visibility for leaders. If a team leader or director is expected to monitor a team, the department assignment must be correct. A wrong department can make reports look incomplete or expose the wrong operational scope.

Examples of department use:

- SEO team.
- Content team.
- Reporting team.
- Technical support or development team.
- Client servicing team.

## Creating a department

1. Open **Departments**.
2. Add the department name in English.
3. Optionally add the Arabic name.
4. Add a short description explaining the team’s operational purpose.
5. Save and verify that employees can be assigned to it.

Keep department names short and stable. Frequent renaming makes cross-period reporting harder to follow.

## Assigning employees and team leaders

After creating the department, assign employees carefully. If the company uses a team leader model, make sure the leader’s employee record is also attached to the same department. This allows role-based access to align with the real reporting line.

## Understanding “workspace” in operations

Many teams describe the actual execution environment as a workspace. That might mean:

- A Trello board used by a department.
- A client delivery area owned by a team.
- A recurring execution lane for one function.

Even if the software deployment does not expose a separate workspace entity, you should still define and document the operating workspace clearly. This reduces confusion when matching people, boards, tasks, and reports.

## Best practices

- One clear department per employee for reporting.
- Standard workspace naming tied to real execution.
- Keep descriptions practical, not overly detailed.
- Review structure after team changes.

## Signs your structure needs cleanup

- Leaders cannot see the people they manage.
- Employees appear in the wrong reports.
- Board ownership is unclear.
- Similar departments overlap without a clear purpose.

A clean structural design reduces permission issues and makes analytics much more trustworthy. If a workflow feels confusing, the root cause is often an unclear department or workspace definition rather than the report itself.


## Recommended rollout sequence

When building structure from scratch, start with the business reality rather than the org chart on paper. List the teams that actually coordinate work together, define their operational owner, and then create departments that support reporting clarity. After that, document which workspace or board each team uses so there is no confusion around where work is expected to happen.

A helpful rollout sequence is:

1. Define the department.
2. Assign the team leader or owner.
3. Move employees into the correct department.
4. Confirm which workspace, board, or operational lane belongs to that department.
5. Run a one-week reporting review to verify the structure behaves as expected.

## Common structure examples

A content department might own article production, editorial review, and publishing coordination. An SEO department might own audits, technical checks, and optimization follow-up. A reporting department might manage recurring client reporting, dashboards, and final delivery review. The labels are less important than consistency. Once the structure is stable, analytics and approvals become significantly easier to trust.

## Governance advice

Avoid redesigning departments every time responsibilities shift slightly. Use department changes for real structural changes, not temporary workload balancing. If workspaces or boards are rearranged frequently, communicate the change clearly and verify that each affected employee still appears under the correct operational view.`,
  },
  {
    title: "User Management: Accounts, Roles, and Employee Linking",
    slug: "user-management-accounts-roles-and-employee-linking",
    category: "settings",
    tags: ["user management", "roles", "employee link", "admin", "permissions"],
    isPublished: true,
    isPinned: false,
    content: `# User Management: Accounts, Roles, and Employee Linking

User management is the administrative layer that controls who can access the system and what they can do after signing in. A user account is responsible for authentication and authorization, while the employee profile represents the operational identity used in reporting and execution. Linking both correctly prevents many common access issues.

## Core user-management responsibilities

Admins typically use this area to:

- Review registered user accounts.
- Assign or change roles.
- Link a user account to an employee profile.
- Correct access after staffing changes.

Because roles directly affect access scope, all changes should be made intentionally and verified immediately after saving.

## Creating or enabling user access

A new person often enters the system through two parallel records:

1. An employee profile for operational tracking.
2. A user account for authentication.

Once both exist, link them so the system can map the logged-in identity to the right employee data.

## Assigning roles safely

Roles determine page access and data visibility. Do not treat them as decorative labels. Giving a user a broader role may expose team-wide or company-wide operational data.

A safe workflow is:

1. Confirm the person’s actual responsibility.
2. Assign the lowest role that still allows them to do their work.
3. Test the account after the change.
4. Document unusual access decisions internally.

## Linking users to employees

When a user account is not linked to the correct employee record, the system may not show the right personal tasks or reports. This is one of the most common setup problems.

To avoid confusion:

- Use matching names where possible.
- Link the account right after creating the employee record.
- Recheck the link after role or department changes.

## Common mistakes

- Giving admin access when team leader access is enough.
- Forgetting to link the user to an employee profile.
- Changing the role but not refreshing the session.
- Leaving duplicate user accounts active.

## Admin tips

- Review user access after onboarding or offboarding.
- Revisit elevated roles monthly.
- Keep employee linking clean before troubleshooting deeper issues.

Strong user management keeps the system secure, reduces confusion, and ensures each person sees the correct operational context from the moment they sign in.


## Recommended onboarding checklist

A dependable onboarding process reduces access tickets dramatically. When a new employee joins, administrators should follow the same order every time:

1. Create the employee profile.
2. Confirm the department and position.
3. Create or verify the user account.
4. Assign the correct role.
5. Link the user to the employee record.
6. Ask the user to sign in and confirm what pages they can see.

This six-step process catches most setup errors before the user begins real work.

## Recommended offboarding checklist

When someone leaves the company or changes responsibilities, update access quickly. Mark the employee inactive when appropriate, review whether the user account should remain active, and reduce elevated permissions immediately. If you skip this step, inactive users may continue to appear in operational reviews or keep broader access than necessary.

## Audit habits that keep access clean

Review the user list regularly and look for three issues: duplicate accounts, users with elevated roles they no longer need, and user accounts that are not linked to any employee profile. Even a short monthly audit can prevent a large number of support questions later.`,
  },
  {
    title: "Daily Reports: Submission, Review, and Approval Flow",
    slug: "daily-reports-submission-review-and-approval-flow",
    category: "tasks",
    tags: ["daily reports", "approval", "summary", "hours", "employees"],
    isPublished: true,
    isPinned: false,
    content: `# Daily Reports: Submission, Review, and Approval Flow

Daily reports turn task execution into a readable operational summary. They help employees communicate what was completed, help leaders review productivity, and create an auditable record of work over time. The quality of daily reports depends heavily on the quality of the tasks behind them.

## What a daily report includes

A typical report can include:

- Total hours logged for the day.
- Number of completed tasks.
- Number of tasks still in progress.
- A short narrative summary.
- Approval status.

Reports may be drafted, generated, and then approved depending on the workflow used in your team.

## Employee submission workflow

A clean employee workflow looks like this:

1. Update task statuses throughout the day.
2. Confirm dates and hours are accurate.
3. Open the report page for the correct date.
4. Review the generated summary or enter any needed context.
5. Save or submit the report before end of day.

If tasks are missing or dated incorrectly, fix the tasks first. The report should reflect reality rather than compensate for bad task hygiene.

## Manager review and approval

Managers should review reports with two questions in mind:

- Does the summary reflect the actual operational work?
- Do the tasks and hours look internally consistent?

If something looks wrong, inspect the underlying tasks instead of approving the report immediately. Approval should signal that the reported work is operationally credible.

## Good reporting habits

- Use clear task titles earlier in the day.
- Avoid leaving many items in in-progress status without notes.
- Log actual hours, not estimated hours, when the work is done.
- Review the report before asking for approval.

## Common causes of weak reports

- Tasks were not updated before report generation.
- Too many broad tasks were used instead of specific ones.
- Hours were entered late from memory.
- The wrong employee or date was selected.

## Why daily reports matter

Over time, daily reports support staffing decisions, workload balancing, client follow-up, and performance analysis. They are not just a formality; they are one of the clearest operational histories the system provides.

A strong daily reporting culture starts with consistent task updates. When tasks are clean, reports become fast, credible, and genuinely useful.


## Building a reliable approval habit

Approvals work best when managers review reports on a consistent schedule rather than waiting several days. A same-day or next-morning review cycle keeps the context fresh and makes it easier to correct errors before they affect weekly analysis. If a report needs revision, send the employee back to the underlying tasks first, then return to the report once the task data is fixed.

## What strong reports look like

A strong report usually tells a simple story: what was completed, what is still in motion, how much time was spent, and whether any blocker needs escalation. It does not need to be long, but it should match the day’s actual execution. The most reliable reports are built from specific tasks with realistic hours and timely status updates.

## Review checklist for approvers

Before approving, managers should confirm:

- the correct employee and date are selected,
- completed work is truly complete,
- in-progress items still need action,
- hours look reasonable for the scope of work,
- the written summary matches the task list.

This review discipline makes reports far more useful for weekly planning and performance conversations.`,
  },
  {
    title: "Notifications and Alerts: What They Mean and How to Use Them",
    slug: "notifications-and-alerts-what-they-mean-and-how-to-use-them",
    category: "settings",
    tags: ["alerts", "notifications", "comments", "deadlines", "read state"],
    isPublished: true,
    isPinned: false,
    content: `# Notifications and Alerts: What They Mean and How to Use Them

Alerts are designed to bring attention to operational situations that need action. Instead of checking every employee and every task manually, leaders can rely on the Alerts section to highlight missed deadlines, overdue work, low productivity signals, and system-level notices.

## Common alert types

You may see alerts such as:

- **deadline_missed**: a task date passed before the task reached a completed state.
- **overdue_task**: time or progress patterns suggest work has exceeded expectations.
- **low_productivity**: a team or employee may be underperforming relative to normal patterns.
- **system**: general operational notices from the platform.

Different roles may see different alerts depending on the intended target role and the data scope available to them.

## How alerts are generated

Alerts are typically generated from existing operational records. For example, if a task is still not done after its intended date, the system can raise a deadline-related alert. That means the reliability of alerts depends on accurate task dates and status updates.

## Working with alerts effectively

1. Open Alerts at the start of the day.
2. Sort mentally by urgency and impact.
3. Investigate the underlying task or employee activity.
4. Take action before simply marking the alert as read.
5. Mark it as read once it is acknowledged or resolved.

The alert itself is only the signal. The value comes from the follow-up.

## Comments and discussion workflow

In many teams, comments or side-channel communication happen alongside alerts when a manager asks for clarification or requests a corrective action. Keep those discussions tied to the real operational issue and avoid vague follow-up like “please fix.” Be specific about what needs to change.

## Marking alerts as read

Marking an alert as read helps clean the queue and reduce noise. However, do not use “mark as read” as a substitute for handling the issue. A read alert should mean the matter is acknowledged, delegated, or resolved.

## Tips for leaders

- Review recurring alert patterns weekly.
- Treat repeated deadline alerts as a process issue, not just a people issue.
- Use alerts with reports and analytics for a fuller picture.

Alerts are most helpful when they shorten response time and focus managerial attention where it matters most.


## Turning alerts into action

An alert should always trigger one of three actions: investigate, delegate, or document. Investigation means opening the related task or employee context immediately. Delegation means assigning the follow-up to the correct team leader or owner. Documentation means leaving a clear note or instruction so the next person understands the reason for the follow-up. Without one of these actions, alerts become background noise.

## Building a healthy alert culture

Teams should avoid two extremes: ignoring alerts completely or overreacting to every single one. The goal is to use alerts as early warning signals. If the same alert type appears repeatedly for the same employee or process, treat that as a coaching or workflow issue rather than an isolated mistake.

## Weekly review suggestion

Once a week, leadership should review the alert log for patterns. Repeated deadline alerts may suggest weak planning. Frequent system alerts may suggest a configuration issue. Overdue-task warnings may show that estimation needs improvement. This pattern review turns alerts into a management tool rather than a simple notification feed.`,
  },
  {
    title: "AI Help Assistant: What It Can Do and Its Limits",
    slug: "ai-help-assistant-what-it-can-do-and-its-limits",
    category: "getting-started",
    tags: ["ai assistant", "help center", "chat", "limitations", "sources"],
    isPublished: true,
    isPinned: false,
    content: `# AI Help Assistant: What It Can Do and Its Limits

The AI Help Assistant is built to answer questions about Tamiyouz TOS using Help Center content. Think of it as a fast conversational layer on top of your internal documentation. It is useful when you want quick guidance without manually opening several articles.

## What it can help with

The assistant is best for questions like:

- How do I set up Trello integration?
- Where do I update a client record?
- What does a certain role have access to?
- How should daily reports be prepared?
- What do the analytics charts mean?

It can also point you toward the most relevant help articles used to answer the question.

## How it works

When you send a question, the assistant loads published help center articles as context and asks the language model to answer only from those articles. It then stores the conversation in a chat session and returns the top matching sources so you can continue reading if needed.

## Why sources matter

The assistant is designed to be grounded in documentation rather than improvising from general knowledge. If a reply includes source links, open them when you need deeper detail or want to verify the original article language.

## Important limitations

The assistant is intentionally limited. If the answer is not documented in the Help Center, it should tell you that the information is not available yet. This is a feature, not a weakness. It reduces the risk of inaccurate operational instructions.

You should not rely on the assistant for:

- Unwritten policy decisions.
- Sensitive credentials or secrets.
- Access changes that require admin action.
- System behavior that is not yet documented.

## Best practices for asking good questions

- Ask one operational question at a time.
- Mention the feature name clearly.
- Include the page or module if you know it.
- Use follow-up questions when refining a previous answer.

## Good example prompts

- “How do I link a user to an employee?”
- “How do I manually sync Trello after updating boards?”
- “What should I review before approving a daily report?”

The AI Help Assistant is most valuable when it saves you time while keeping you anchored to trusted internal documentation.


## How to get better answers

The assistant performs best when the question includes a clear feature name, page name, or job-to-be-done. Instead of asking “why is this not working,” ask “how do I manually sync Trello after changing board access?” Specific phrasing helps the assistant match the correct help articles and return better sources.

## How to use source links wisely

The returned source links are meant to help you move from quick guidance to deeper reading. If a process is important, such as setting permissions or integrating Trello, open the source article and read the exact steps before acting. The chat reply is great for speed, while the article is better for confirmation and team training.

## When to expand the Help Center

If users repeatedly ask the assistant about something it cannot answer, that is usually a documentation gap. Capture those questions and convert them into new help articles. Over time, the assistant becomes more valuable as the Help Center becomes richer.`,
  },
  {
    title: "Settings Guide: Trello, AI, and System Configuration",
    slug: "settings-guide-trello-ai-and-system-configuration",
    category: "settings",
    tags: ["settings", "trello", "configuration", "system", "ai"],
    isPublished: true,
    isPinned: false,
    content: `# Settings Guide: Trello, AI, and System Configuration

The Settings area is where administrators maintain the parts of the platform that affect multiple teams at once. Unlike day-to-day pages such as tasks or reports, settings should be changed carefully because a small configuration change can impact visibility, automation, or integrations across the whole organization.

## Types of settings you may manage

Common categories include:

- Trello integration credentials and sync controls.
- User access and role administration.
- AI-related configuration and operational prompts.
- General system configuration tied to the current deployment.

Not every deployment will expose every setting, but the guiding principle is the same: only authorized users should make changes, and changes should be verified immediately.

## Managing Trello settings

The Trello section is usually the most operationally sensitive because it controls external sync. After updating credentials, always test the connection and perform a controlled sync before declaring setup complete.

## Managing AI-related configuration

If your deployment exposes AI-related controls, treat them like operational logic. Small changes in prompts or configuration can affect how generated summaries, analyses, or help responses behave. Review outputs after any adjustment.

## General configuration tips

- Change one thing at a time.
- Confirm the expected effect immediately.
- Keep a note of who changed what and why.
- Avoid testing in production during peak operating hours if the change affects multiple teams.

## When to escalate

Escalate a settings issue when:

- an integration fails after valid credentials were saved,
- multiple users report access changes unexpectedly,
- AI outputs become unusable after configuration changes,
- a system-level setting appears to affect performance or reliability.

Settings should support stable operations, not become a daily troubleshooting zone. Fewer, cleaner, well-documented changes usually produce the best long-term results.


## Recommended change-management workflow

A safe settings workflow has four stages: prepare, change, verify, and communicate. Prepare by understanding exactly what setting you are touching. Change only one area at a time. Verify the result by testing the related user flow. Communicate the change to affected stakeholders if it impacts how people work. This prevents the classic problem of making several changes at once and not knowing which one caused an issue.

## Example verification steps

After changing Trello settings, test connection and run a controlled sync. After changing a role or user-related setting, sign in with the affected account or ask the user to verify visibility. After changing AI-related configuration, generate one sample output and review whether the language and structure still match expectations.

## Documentation habit

Keep a short internal note for meaningful settings changes, including date, person responsible, and reason. This small habit makes later troubleshooting much faster and reduces repeated experimentation. Good settings management is not just about the right value; it is about traceability and confidence.`,
  },
  {
    title: "Roles and Permissions Reference",
    slug: "roles-and-permissions-reference",
    category: "other",
    tags: ["roles", "permissions", "access", "admin", "team leader"],
    isPublished: true,
    isPinned: false,
    content: `# Roles and Permissions Reference

Tamiyouz TOS uses role-based access so each user sees the operational scope that matches their responsibility. The table below is a practical reference, not just a technical description.

| Role | Typical visibility | Common actions |
| --- | --- | --- |
| super_admin | Full system scope | Full system management, settings, users, integrations |
| admin | Near-full system scope | Manage users, setup, settings, operational records |
| ceo | Company-wide visibility | Review company performance and top-level operations |
| cmo | Broad leadership visibility | Review teams, performance, and marketing execution |
| director | Department-oriented visibility | Monitor departments, reports, and team execution |
| team_leader | Team-level visibility | Assign work, review team output, coordinate execution |
| employee | Personal visibility | Update personal tasks and submit personal reports |

## Practical interpretation

### super_admin

Reserved for the highest level of control. This role should be limited to very trusted administrators because it can affect the entire platform.

### admin

Handles operational administration such as user management, settings, and system configuration. In many organizations, this is the everyday administrative role.

### ceo and cmo

These leadership roles typically need broad visibility but do not necessarily manage every technical setting. Their value is in reviewing performance and operational outcomes across teams.

### director

Directors usually monitor department-level work and use reports, analytics, and staffing visibility to keep execution on track.

### team_leader

Team leaders coordinate daily work. They often create records, assign tasks, and monitor the work of the team they directly manage.

### employee

Employees focus on their own workload, task updates, and daily reporting. They should not be given elevated access unless their responsibility genuinely changes.

## Permission management tips

- Grant the minimum access required.
- Re-check roles after promotions or team changes.
- Test important changes with the affected user.
- Do not use admin access as a shortcut for convenience.

Clear permission design makes the entire system safer and easier to trust.


## How to choose the right role

When assigning a role, start from responsibility, not seniority. Someone can be very experienced and still only need employee-level access if their work is individual and does not require team visibility. On the other hand, a team leader who must assign work and monitor direct reports may need broader access even if they are not part of upper management.

## Permission assignment checklist

Before changing a role, ask:

- Does this user need to view only personal data, team data, or company-wide data?
- Do they need to create or update records for others?
- Do they need access to system settings or integrations?
- Is there a lower role that would still allow them to do the job safely?

## Verification after role changes

After changing a role, refresh the session and confirm the visible pages match expectations. This is especially important when moving a user into team_leader, director, or admin-level access. Small verification steps prevent large access mistakes later.

## Final principle

The strongest permission model is the one that is easy to explain. If your team cannot clearly explain why a user has a certain role, review it again.`,
  },
  {
    title: "Troubleshooting Common TOS Issues",
    slug: "troubleshooting-common-tos-issues",
    category: "other",
    tags: ["troubleshooting", "login", "sync", "permissions", "errors"],
    isPublished: true,
    isPinned: false,
    content: `# Troubleshooting Common TOS Issues

Most issues in Tamiyouz TOS fall into a few predictable categories: login problems, integration sync failures, incorrect permissions, and incomplete operational data. A calm troubleshooting process usually resolves them faster than random trial and error.

## Login issues

### Symptom
You cannot sign in or the system keeps returning you to the login page.

### Checks

- Confirm you are using the correct account.
- Verify that your user account exists in the system.
- Confirm that the session cookie is being stored by the browser.
- Try signing out completely and signing back in.

### Most likely causes

- Account not created yet.
- Role not assigned correctly.
- Browser blocking the session cookie.

## Trello sync failures

### Symptom
Boards, cards, or updates are not syncing.

### Checks

- Re-test the API key and token.
- Confirm the Trello account still has access to the board.
- Verify the correct board is attached to the correct operational flow.
- Run a manual sync after changes.

### Most likely causes

- Revoked or expired token.
- Wrong board mapping.
- Recent Trello changes not yet synchronized.

## Permission errors

### Symptom
A user cannot access a page they expected to see.

### Checks

- Confirm the current signed-in account.
- Check the assigned role.
- Confirm the user is linked to the correct employee profile.
- Refresh the session after access changes.

### Most likely causes

- Wrong role.
- Missing employee link.
- Department mismatch affecting visibility.

## Report or analytics data looks wrong

### Symptom
Counts, hours, or summaries do not match expectations.

### Checks

- Review the task records first.
- Confirm task dates are correct.
- Check whether statuses were updated before report generation.
- Confirm actual hours were logged.

### Most likely causes

- Outdated task statuses.
- Tasks assigned to the wrong date.
- Missing client or employee linkage.

## General troubleshooting method

1. Identify the exact symptom.
2. Confirm the account and role.
3. Check the underlying record, not just the final screen.
4. Re-test after one controlled change.
5. Escalate with specific evidence if needed.

Good troubleshooting is structured. The more precise the diagnosis, the faster the fix.


## Escalation checklist

If the issue is not solved after basic checks, escalate with useful evidence. Include the affected page, the user role, the exact error or symptom, whether the issue is reproducible, and what was already tested. Good escalation saves time because the next person does not need to repeat the same discovery steps.

## Preventive habits

Many recurring problems can be reduced with a few habits: keep roles current, link users to employee records early, review Trello credentials after any account change, and train teams to update tasks before reports are generated. Prevention is usually easier than troubleshooting after data has already become inconsistent.

## Troubleshooting mindset

Do not change five things at once. Make one controlled adjustment, re-test, and observe the result. This method is slower for a minute but much faster overall because it helps you identify the real cause instead of creating new variables.`,
  },
  {
    title: "What’s New in Tamiyouz TOS v1.0.0",
    slug: "whats-new-in-tamiyouz-tos-v1-0-0",
    category: "updates",
    tags: ["updates", "changelog", "v1.0.0", "new features"],
    isPublished: true,
    isPinned: true,
    version: "v1.0.0",
    content: `# What’s New in Tamiyouz TOS v1.0.0

Version 1.0.0 brings the core operating model of Tamiyouz TOS into one connected workflow. This release focuses on daily execution, management visibility, and a cleaner system foundation for future expansion.

## Major release highlights

### 1. Role-based operational dashboard

Users now see pages and capabilities based on their role. Employees can focus on personal work, while leaders and administrators gain broader operational visibility.

### 2. Employees and departments management

The platform now supports structured employee records and department assignments, creating a cleaner reporting hierarchy across teams.

### 3. Clients module

Client records can now be stored and maintained in a dedicated operational area, improving traceability between accounts and delivery work.

### 4. Task tracking workflow

Tasks can be assigned to employees, linked to clients, updated through multiple statuses, and reviewed through daily reporting and analytics.

### 5. Daily reports

Teams now have a dedicated reporting layer that summarizes hours, completed work, work in progress, and managerial approval state.

### 6. Alerts and visibility

Operational alerts help leaders detect missed deadlines, overdue work patterns, and important system notices earlier.

### 7. Trello integration support

Administrators can configure Trello credentials and trigger synchronization to support Trello-based operational workflows.

### 8. AI-powered assistance

The platform includes AI-assisted reporting and analysis features, plus a Help Center assistant that answers documentation-based questions.

## Why this release matters

This release turns TOS from a collection of pages into an operational system with connected structure: people, clients, tasks, reports, and analytics now support each other more naturally.

## Recommended next steps after upgrade

- Review role assignments.
- Verify employee-to-user links.
- Standardize task naming.
- Confirm Trello settings if sync is required.
- Train team leaders on reports and analytics.

Version 1.0.0 is the baseline release for running day-to-day agency operations with stronger clarity and accountability.


## Operational impact by team

For employees, this release creates a clearer daily flow between tasks and reports. For team leaders, it improves visibility into who is doing what and which work items are blocked or overdue. For directors and executives, it creates a stronger foundation for analytics and cross-team monitoring. For admins, it centralizes user, settings, and integration management more cleanly than before.

## Suggested rollout plan

To get the most value from v1.0.0, teams should roll it out in stages. Start by confirming departments, employees, and roles. Then create or clean up client records. After that, standardize task naming and status usage. Finally, introduce daily reports and analytics review as part of the weekly operating rhythm. This staged rollout helps teams adopt the system without creating confusion.

## Why the changelog matters

The updates page is not only for announcement purposes. It gives teams a shared reference for what is available now, what practices should change, and what capabilities are officially supported in the current release.`,
  },

];

export default helpCenterSeedArticles;
