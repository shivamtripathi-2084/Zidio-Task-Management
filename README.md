# Zidio Task Management

Live app: https://zidio-task-management.netlify.app/

## Roles and task workflow

- **Admin** creates tasks, assigns them to one or more editors, and can edit or delete any task. Admins can also manage users' roles.
- **Editor** can view and update task details and status only for tasks assigned to them. Multiple editors can share a task. Editors cannot create or delete tasks or change task assignments.
- **Viewer** can view tasks but cannot change tasks, comments, attachments, or roles.
- Task statuses are **Pending**, **In Progress**, and **Completed**.
- To assign a task, an admin selects one or more editors from the assignee list. The UI shows each editor's name and email; it sends their account IDs automatically.
- New registrations are always assigned the **Viewer** role. An existing admin assigns Editor/Admin roles from the user role management panel.

The backend enforces these permissions; hiding a control in the frontend is not the only access check.
