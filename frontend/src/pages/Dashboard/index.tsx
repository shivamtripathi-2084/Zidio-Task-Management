import ProtectedRoute from "../../compoents/ProtectedRoute"
import { useTask } from "../../context/Task.context"
import AddTask from "./components/AddTask"
import AllTask from "./components/AllTask"
import AdminUserManagement from "./components/AdminUserManagement"
import { useAuth } from "../../context/Auth.context"

const Dashboard =()=>{
    const { taskStats, notifications } = useTask();
    const { user } = useAuth();

    return <ProtectedRoute>
    
        <div className="coantainer col-sm-12">
            <div className="container py-5 px-5  col-sm-12">
                <div className="row g-3 mb-4">
                    <div className="col-md-3">
                        <div className="card border-0 shadow-sm h-100">
                            <div className="card-body">
                                <div className="text-muted">Total Tasks</div>
                                <h3 className="mt-2 mb-0">{taskStats.total}</h3>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="card border-0 shadow-sm h-100">
                            <div className="card-body">
                                <div className="text-muted">In Progress</div>
                                <h3 className="mt-2 mb-0 text-primary">{taskStats.inProgress}</h3>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="card border-0 shadow-sm h-100">
                            <div className="card-body">
                                <div className="text-muted">Completed</div>
                                <h3 className="mt-2 mb-0 text-success">{taskStats.completed}</h3>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="card border-0 shadow-sm h-100">
                            <div className="card-body">
                                <div className="text-muted">Pending</div>
                                <h3 className="mt-2 mb-0 text-warning">{taskStats.pending}</h3>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="card border-0 shadow-sm h-100">
                            <div className="card-body">
                                <div className="text-muted">Completion</div>
                                <h3 className="mt-2 mb-0">{taskStats.completionRate}%</h3>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card border-0 shadow-sm mb-4">
                    <div className="card-body">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h5 className="mb-0">Reminders</h5>
                            <span className="badge bg-primary rounded-pill">{notifications.length}</span>
                        </div>
                        {notifications.length > 0 ? (
                            <ul className="list-group list-group-flush">
                                {notifications.map((notification, index) => (
                                    <li key={`${notification.title}-${index}`} className="list-group-item px-0">
                                        <div className="d-flex align-items-start gap-2">
                                            <span className={`badge rounded-pill ${notification.type === 'overdue' ? 'bg-danger' : 'bg-warning text-dark'}`}>
                                                {notification.type === 'overdue' ? 'Overdue' : 'Due Soon'}
                                            </span>
                                            <div>
                                                <div className="fw-semibold">{notification.title}</div>
                                                <div className="text-muted small">{notification.message}</div>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-muted mb-0">No active reminders.</p>
                        )}
                    </div>
                </div>

                {user.role === "admin" && <AdminUserManagement />}
                {user.role === "admin" && <AddTask />}
                <AllTask />


            </div>

        </div>
    </ProtectedRoute>
}

export default Dashboard