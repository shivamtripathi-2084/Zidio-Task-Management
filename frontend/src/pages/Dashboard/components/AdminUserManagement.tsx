import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { ManagedUser, useAuth } from "../../../context/Auth.context";

const AdminUserManagement = () => {
  const { user, getUsers, updateUserRole } = useAuth();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;
    getUsers()
      .then((result) => {
        if (isCurrent) setUsers(result);
      })
      .catch((error: Error) => {
        if (isCurrent) toast.error(error.message);
      })
      .finally(() => {
        if (isCurrent) setLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [getUsers]);

  const handleRoleChange = async (target: ManagedUser, role: ManagedUser["role"]) => {
    if (target.role === role || target.email === user.email) return;

    try {
      setUpdatingUserId(target._id);
      await updateUserRole(target._id, role);
      setUsers(await getUsers());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update user role");
    } finally {
      setUpdatingUserId(null);
    }
  };

  return (
    <section className="card border-0 shadow-sm mb-4">
      <div className="card-body">
        <h2 className="h5">User role management</h2>
        <p className="text-muted">Only administrators can change roles. New accounts start as viewers.</p>
        {loading ? (
          <p className="mb-0">Loading users...</p>
        ) : users.length ? (
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Email</th>
                  <th scope="col">Role</th>
                </tr>
              </thead>
              <tbody>
                {users.map((managedUser) => {
                  const isSelf = managedUser.email === user.email;
                  return (
                    <tr key={managedUser._id}>
                      <td>{managedUser.name}{isSelf ? " (you)" : ""}</td>
                      <td>{managedUser.email}</td>
                      <td>
                        <select
                          className="form-select"
                          aria-label={`Role for ${managedUser.email}`}
                          value={managedUser.role}
                          disabled={isSelf || updatingUserId === managedUser._id}
                          onChange={(event) => handleRoleChange(managedUser, event.target.value as ManagedUser["role"])}
                        >
                          <option value="viewer">Viewer</option>
                          <option value="editor">Editor</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mb-0">No users found.</p>
        )}
      </div>
    </section>
  );
};

export default AdminUserManagement;
