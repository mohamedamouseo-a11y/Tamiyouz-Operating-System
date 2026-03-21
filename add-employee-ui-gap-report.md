# Add Employee UI Gap Report

## 1. Frontend file/component path
- **File Path**: `client/src/pages/EmployeesPage.tsx`
- **Component**: `EmployeesPage`

## 2. Current click behavior
The "Add Employee" button currently has an inline `onClick` handler that triggers a toast notification:
\`\`\`tsx
<Button onClick={() => toast.info("Feature coming soon")}>
  <UserPlus className="h-4 w-4 mr-2" />
  Add Employee
</Button>
\`\`\`
This behavior is a placeholder and does not open any form or trigger any data creation logic.

## 3. Existing create employee API/function path
- **tRPC Route**: \`employees.create\` defined in \`server/routers.ts\` (line 114).
- **Backend Function**: \`createEmployee\` defined in \`server/db.ts\` (line 147).
- **Functionality**: The function is fully implemented and uses Drizzle ORM to insert a new employee record into the database. It requires \`super_admin\` or \`admin\` privileges.

## 4. Missing pieces needed to make Add Employee work
1.  **UI Modal/Form**: A dialog or separate page containing a form to collect employee details (name, email, phone, departmentId, position, etc.).
2.  **Form Validation**: Client-side validation (e.g., using Zod and React Hook Form) to match the backend schema requirements.
3.  **tRPC Mutation Hook**: Integration of \`trpc.employees.create.useMutation()\` within the frontend component.
4.  **State Management**: Logic to open/close the modal and handle the loading/error states during the mutation.
5.  **Cache Invalidation**: Calling \`utils.employees.list.invalidate()\` after a successful creation to refresh the employee list.

## 5. Conclusion
The backend infrastructure (API route and database function) for adding employees is already fully functional, but the frontend currently only contains a placeholder button with no associated form or mutation logic.
