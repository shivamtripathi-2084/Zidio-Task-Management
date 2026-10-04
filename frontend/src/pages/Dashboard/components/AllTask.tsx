



import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { RxCross2 } from 'react-icons/rx';
import { toast } from 'react-toastify';
import { Task, TaskAttachment, TaskComment, TaskStatus, useTask } from '../../../context/Task.context';
import { ManagedUser, useAuth } from '../../../context/Auth.context';

const TaskComments = ({ taskId, canComment }: { taskId: string; canComment: boolean }) => {
    const { getTaskComments, addTaskComment } = useTask();
    const [comments, setComments] = useState<TaskComment[]>([]);
    const [commentText, setCommentText] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        let isCurrent = true;
        getTaskComments(taskId)
            .then((taskComments) => {
                if (isCurrent) setComments(taskComments);
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
    }, [taskId, getTaskComments]);

    const submitComment = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const text = commentText.trim();
        if (!text) return;

        try {
            setSubmitting(true);
            setComments(await addTaskComment(taskId, text));
            setCommentText('');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Unable to add comment');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="mt-3 border-top pt-3">
            <h2 className="h6">Comments</h2>
            {loading ? (
                <p className="text-muted">Loading comments...</p>
            ) : comments.length ? (
                <ul className="list-group mb-3">
                    {comments.map((comment) => (
                        <li key={comment._id} className="list-group-item">
                            <div className="d-flex justify-content-between gap-2">
                                <strong>{comment.user?.name || comment.user?.email || 'User'}</strong>
                                <small className="text-muted">{new Date(comment.createdAt).toLocaleString()}</small>
                            </div>
                            <p className="mb-0 mt-1 text-break">{comment.text}</p>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-muted">No comments yet.</p>
            )}
            {canComment && (
                <form onSubmit={submitComment}>
                    <label htmlFor={`comment-${taskId}`} className="form-label">Add a comment</label>
                    <textarea
                        id={`comment-${taskId}`}
                        className="form-control mb-2"
                        rows={2}
                        maxLength={1000}
                        value={commentText}
                        onChange={(event) => setCommentText(event.target.value)}
                        required
                    />
                    <button type="submit" className="btn btn-sm btn-primary" disabled={submitting || !commentText.trim()}>
                        {submitting ? 'Posting...' : 'Post comment'}
                    </button>
                </form>
            )}
        </div>
    );
};

const TaskAttachments = ({
    taskId,
    initialAttachments,
    canManage,
}: {
    taskId: string;
    initialAttachments: TaskAttachment[];
    canManage: boolean;
}) => {
    const { uploadTaskAttachments, downloadTaskAttachment, deleteTaskAttachment } = useTask();
    const [attachments, setAttachments] = useState(initialAttachments);
    const [uploading, setUploading] = useState(false);
    const [busyAttachmentId, setBusyAttachmentId] = useState<string | null>(null);

    useEffect(() => {
        setAttachments(initialAttachments);
    }, [initialAttachments]);

    const uploadFiles = async (event: ChangeEvent<HTMLInputElement>) => {
        const input = event.currentTarget;
        const files = Array.from(input.files || []);
        if (!files.length) return;

        try {
            setUploading(true);
            setAttachments(await uploadTaskAttachments(taskId, files));
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Unable to upload files');
        } finally {
            setUploading(false);
            input.value = '';
        }
    };

    const downloadFile = async (attachment: TaskAttachment) => {
        try {
            setBusyAttachmentId(attachment._id);
            const blob = await downloadTaskAttachment(taskId, attachment._id);
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = attachment.originalName;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Unable to download file');
        } finally {
            setBusyAttachmentId(null);
        }
    };

    const removeFile = async (attachmentId: string) => {
        try {
            setBusyAttachmentId(attachmentId);
            await deleteTaskAttachment(taskId, attachmentId);
            setAttachments((current) => current.filter((attachment) => attachment._id !== attachmentId));
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Unable to delete file');
        } finally {
            setBusyAttachmentId(null);
        }
    };

    return (
        <div className="mt-3 border-top pt-3">
            <h2 className="h6">Attachments ({attachments.length}/10)</h2>
            {attachments.length ? (
                <ul className="list-group mb-3">
                    {attachments.map((attachment) => (
                        <li key={attachment._id} className="list-group-item d-flex justify-content-between align-items-center gap-2">
                            <span className="text-break">{attachment.originalName} ({(attachment.size / (1024 * 1024)).toFixed(1)} MB)</span>
                            <span className="text-nowrap">
                                <button
                                    type="button"
                                    className="btn btn-sm btn-outline-primary me-2"
                                    onClick={() => downloadFile(attachment)}
                                    disabled={busyAttachmentId === attachment._id}
                                >
                                    Download
                                </button>
                                {canManage && (
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-outline-danger"
                                        onClick={() => removeFile(attachment._id)}
                                        disabled={busyAttachmentId === attachment._id}
                                        aria-label={`Delete ${attachment.originalName}`}
                                    >
                                        <RxCross2 />
                                    </button>
                                )}
                            </span>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-muted">No files attached.</p>
            )}
            {canManage && attachments.length < 10 && (
                <div>
                    <label htmlFor={`attachments-${taskId}`} className="form-label">Upload files (PDF, images, TXT, DOCX; max 10 MB each)</label>
                    <input
                        id={`attachments-${taskId}`}
                        type="file"
                        className="form-control"
                        accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.docx"
                        multiple
                        onChange={uploadFiles}
                        disabled={uploading}
                    />
                    {uploading && <small className="text-muted">Uploading...</small>}
                </div>
            )}
        </div>
    );
};

const TaskEditor = ({
    task,
    canAssign,
    onCancel,
}: {
    task: Task;
    canAssign: boolean;
    onCancel: () => void;
}) => {
    const { updateTask } = useTask();
    const { getUsers } = useAuth();
    const [editors, setEditors] = useState<ManagedUser[]>([]);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        title: task.title,
        description: task.description,
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : '',
        priority: task.priority || 'medium',
        status: task.status || 'pending',
        assignees: (task.assignees?.length ? task.assignees : task.assignee ? [task.assignee] : [])
            .map((assignee) => assignee?._id || '')
            .filter(Boolean),
    });

    useEffect(() => {
        if (canAssign) {
            getUsers()
                .then((users) => setEditors(users.filter((member) => member.role === 'editor')))
                .catch((error: Error) => toast.error(error.message));
        }
    }, [canAssign, getUsers]);

    const save = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        try {
            setSaving(true);
            await updateTask(task._id, {
                title: form.title.trim(),
                description: form.description.trim(),
                dueDate: form.dueDate || null,
                priority: form.priority as NonNullable<Task['priority']>,
                status: form.status as TaskStatus,
                ...(canAssign ? { assignees: form.assignees } : {}),
            });
            onCancel();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Unable to update task');
        } finally {
            setSaving(false);
        }
    };

    return (
        <form className="mt-3 border-top pt-3" onSubmit={save}>
            <h2 className="h6">Edit task</h2>
            <label className="form-label" htmlFor={`task-title-${task._id}`}>Title</label>
            <input
                id={`task-title-${task._id}`}
                className="form-control mb-2"
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                required
            />
            <label className="form-label" htmlFor={`task-description-${task._id}`}>Details</label>
            <textarea
                id={`task-description-${task._id}`}
                className="form-control mb-2"
                rows={3}
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                required
            />
            <label className="form-label" htmlFor={`task-status-${task._id}`}>Status</label>
            <select
                id={`task-status-${task._id}`}
                className="form-select mb-2"
                value={form.status}
                onChange={(event) => setForm({ ...form, status: event.target.value as TaskStatus })}
            >
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
            </select>
            <label className="form-label" htmlFor={`task-priority-${task._id}`}>Priority</label>
            <select
                id={`task-priority-${task._id}`}
                className="form-select mb-2"
                value={form.priority}
                onChange={(event) => setForm({ ...form, priority: event.target.value as NonNullable<Task['priority']> })}
            >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
            </select>
            <label className="form-label" htmlFor={`task-due-date-${task._id}`}>Due date</label>
            <input
                id={`task-due-date-${task._id}`}
                className="form-control mb-2"
                type="date"
                value={form.dueDate}
                onChange={(event) => setForm({ ...form, dueDate: event.target.value })}
            />
            {canAssign && (
                <>
                    <fieldset className="mb-2">
                        <legend className="form-label">Assign to editors</legend>
                        {editors.length ? editors.map((editor) => (
                            <label key={editor._id} className="form-check d-flex align-items-center gap-2">
                                <input
                                    type="checkbox"
                                    className="form-check-input mt-0"
                                    checked={form.assignees.includes(editor._id)}
                                    onChange={(event) => {
                                        const assignees = event.target.checked
                                            ? [...form.assignees, editor._id]
                                            : form.assignees.filter((id) => id !== editor._id);
                                        setForm({ ...form, assignees });
                                    }}
                                />
                                <span>{editor.name} ({editor.email})</span>
                            </label>
                        )) : <p className="text-muted mb-0">No editor accounts available.</p>}
                        {!form.assignees.length && <small className="text-muted">No editors selected; task will be unassigned.</small>}
                    </fieldset>
                </>
            )}
            <button type="submit" className="btn btn-sm btn-primary me-2" disabled={saving}>
                {saving ? 'Saving...' : 'Save changes'}
            </button>
            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={onCancel} disabled={saving}>
                Cancel
            </button>
        </form>
    );
};

const AllTask = () => {
    const { tasks = [], deleteTaskById } = useTask();
    const { user } = useAuth();
    const [commentsTaskId, setCommentsTaskId] = useState<string | null>(null);
    const [attachmentsTaskId, setAttachmentsTaskId] = useState<string | null>(null);
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

    useEffect(() => {
        const overdueTasks = tasks.filter((task) => !task.isComplete && task.dueDate && new Date(task.dueDate) < new Date());
        if (overdueTasks.length > 0) {
            toast.warning(`You have ${overdueTasks.length} overdue task(s).`);
        }
    }, [tasks]);

    const getDueState = (task: Task) => {
        if (!task.dueDate) return { label: 'No deadline', className: 'bg-secondary' };

        const dueDate = new Date(task.dueDate);
        const now = new Date();
        const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (task.status === 'completed') return { label: 'Completed', className: 'bg-success' };

        if (diffDays < 0) return { label: 'Overdue', className: 'bg-danger' };
        if (diffDays === 0) return { label: 'Due today', className: 'bg-warning text-dark' };
        if (diffDays <= 2) return { label: `Due in ${diffDays} day(s)`, className: 'bg-info text-dark' };

        return { label: `Due ${new Date(task.dueDate).toLocaleDateString()}`, className: 'bg-light text-dark' };
    };

    return (
        <>
            <div className="mb-3">
                <h1>All Tasks ({tasks?.length || 0})</h1>
            </div>
            <div className="flex-wrap d-flex justify-content-center align-items-center">
                {tasks && tasks.length > 0 ? (
                    tasks.map((cur: Task) => {
                        const dueState = getDueState(cur);

                        return (
                            <div
                                key={cur._id}
                                className="card border py-4 px-4 mx-2 my-2 col-sm-12 col-md-6 col-lg-3"
                            >
                                <h1
                                    className={`card-heading ${
                                        cur.status === 'completed' ? 'text-decoration-line-through' : ''
                                    }`}
                                >
                                    {cur.title}
                                </h1>
                                <p className="card-body">{cur.description}</p>
                                <div className="mb-2">
                                    <span className={`badge ${cur.status === 'completed' ? 'bg-success' : cur.status === 'in-progress' ? 'bg-primary' : 'bg-secondary'} me-2`}>
                                        {cur.status === 'in-progress' ? 'In Progress' : cur.status === 'completed' ? 'Completed' : 'Pending'}
                                    </span>
                                    <span className={`badge ${cur.priority === 'high' ? 'bg-danger' : cur.priority === 'medium' ? 'bg-warning text-dark' : 'bg-success'} me-2`}>
                                        {cur.priority || 'medium'}
                                    </span>
                                    {(cur.assignees?.length ? cur.assignees : cur.assignee ? [cur.assignee] : []).map((assignee) => (
                                        <span key={assignee._id || assignee.email} className="badge bg-secondary me-1">
                                            {assignee.name || assignee.email || 'Editor'}
                                        </span>
                                    ))}
                                </div>
                                {cur.dueDate && (
                                    <span className={`badge ${dueState.className} mb-3`}>
                                        {dueState.label}
                                    </span>
                                )}
                                {!cur.dueDate && (
                                    <span className="badge bg-secondary mb-3">No deadline</span>
                                )}
                                <div className="d-flex flex-wrap align-items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setCommentsTaskId(commentsTaskId === cur._id ? null : cur._id)}
                                        className="btn btn-outline-secondary rounded-pill"
                                    >
                                        {commentsTaskId === cur._id ? 'Hide comments' : 'Comments'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setAttachmentsTaskId(attachmentsTaskId === cur._id ? null : cur._id)}
                                        className="btn btn-outline-secondary rounded-pill"
                                    >
                                        {attachmentsTaskId === cur._id ? 'Hide files' : `Files (${cur.attachments?.length || 0})`}
                                    </button>
                                    {cur.canManage && user.role !== 'viewer' && (
                                        <button
                                            type="button"
                                            onClick={() => setEditingTaskId(editingTaskId === cur._id ? null : cur._id)}
                                            className="btn btn-outline-primary rounded-pill"
                                        >
                                            {editingTaskId === cur._id ? 'Close edit' : 'Edit'}
                                        </button>
                                    )}
                                    {cur.canDelete && user.role === 'admin' && (
                                        <button
                                            type="button"
                                            onClick={() => deleteTaskById(cur._id)}
                                            title="Delete"
                                            className="btn btn-outline-danger rounded-pill"
                                        >
                                            <RxCross2 />
                                        </button>
                                    )}
                                </div>
                                {editingTaskId === cur._id && (
                                    <TaskEditor
                                        task={cur}
                                        canAssign={user.role === 'admin'}
                                        onCancel={() => setEditingTaskId(null)}
                                    />
                                )}
                                {commentsTaskId === cur._id && <TaskComments taskId={cur._id} canComment={user.role !== 'viewer'} />}
                                {attachmentsTaskId === cur._id && (
                                    <TaskAttachments
                                        taskId={cur._id}
                                        initialAttachments={cur.attachments || []}
                                        canManage={Boolean(cur.canManageAttachments && user.role !== 'viewer')}
                                    />
                                )}
                            </div>
                        );
                    })
                ) : (
                    <h1 className="text-center text-decoration-underline">No Tasks Available</h1>
                )}
            </div>
        </>
    );
};

export default AllTask;
