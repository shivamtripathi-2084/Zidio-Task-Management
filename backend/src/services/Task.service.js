const httpStatus = require("http-status").default || require("http-status");
const { UserModel,TaskModel } = require("../models")
const { ApiError } = require("../utils/ApiError");
const JWTService = require("../utils/jwt");
const path = require("path");
const { removeStoredFiles } = require("../utils/taskAttachmentStorage");

const taskVisibilityFilter = (user,role) => role === "editor"
    ? { $or: [{ assignees: user }, { assignee: user }] }
    : {};
const taskStatus = (task) => task.status || (task.isComplete ? "completed" : "pending");
const getTaskAssigneeIds = (task) => {
    const ids = (task.assignees || []).map((assignee) => String(assignee?._id || assignee));
    if(task.assignee){
        ids.push(String(task.assignee?._id || task.assignee));
    }
    return [...new Set(ids)];
};

class TaskService{
        static async addTask(body,user){
                const {title,desc,dueDate,priority} = body
                const assigneeIds = [...new Set(body.assignees || (body.assignee ? [body.assignee] : []))];
                if(assigneeIds.length){
                    const editors = await UserModel.find({ _id: { $in: assigneeIds }, role: "editor" }).select("_id");
                    if(editors.length !== assigneeIds.length){
                        throw new ApiError(httpStatus.BAD_REQUEST,"Tasks can only be assigned to editor accounts")
                    }
                }
                await TaskModel.create({
                    user,
                    assignees: assigneeIds,
                    title,
                    description:desc,
                    priority: priority || "medium",
                    dueDate: dueDate ? new Date(dueDate) : null,
                    status: "pending",
                    isComplete: false
                })
                return {
                    msg:"Task Added"
                }
        }

        static async getAllTask(user,role){
            const tasks = await TaskModel.find(taskVisibilityFilter(user,role))
                .sort({ dueDate: 1, createdAt: -1 })
                .populate("assignee", "name email role")
                .populate("assignees", "name email role");
            const accessibleTasks = tasks.map((task) => {
                const assignees = task.assignees?.length
                    ? task.assignees
                    : task.assignee ? [task.assignee] : [];
                const isAssignedEditor = role === "editor" && getTaskAssigneeIds(task).includes(String(user));
                const status = taskStatus(task);
                return {
                    ...task.toObject(),
                    assignees,
                    status,
                    isComplete: status === "completed",
                    canManage: role === "admin" || isAssignedEditor,
                    canDelete: role === "admin",
                    canManageAttachments: role === "admin" || isAssignedEditor,
                    attachments: (task.attachments || []).map((attachment) => ({
                        _id: attachment._id,
                        originalName: attachment.originalName,
                        mimeType: attachment.mimeType,
                        size: attachment.size,
                        uploadedBy: attachment.uploadedBy,
                        createdAt: attachment.createdAt
                    }))
                };
            });

            return {
                tasks: accessibleTasks,
                total: accessibleTasks.length
            }
        }

        static async getTaskStats(user,role){
            const tasks = await TaskModel.find(taskVisibilityFilter(user,role));
            const total = tasks.length;
            const completed = tasks.filter((task) => taskStatus(task) === "completed").length;
            const inProgress = tasks.filter((task) => taskStatus(task) === "in-progress").length;
            const pending = tasks.filter((task) => taskStatus(task) === "pending").length;
            const overdue = tasks.filter((task) => taskStatus(task) !== "completed" && task.dueDate && new Date(task.dueDate) < new Date()).length;
            const dueSoon = tasks.filter((task) => taskStatus(task) !== "completed" && task.dueDate && (() => {
                const diffDays = Math.ceil((new Date(task.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                return diffDays >= 0 && diffDays <= 2;
            })()).length;
            const completionRate = total ? Math.round((completed / total) * 100) : 0;

            return {
                total,
                completed,
                inProgress,
                pending,
                overdue,
                dueSoon,
                completionRate,
            }
        }

        static async getTaskNotifications(user,role){
            const tasks = await TaskModel.find(taskVisibilityFilter(user,role)).sort({ dueDate: 1, createdAt: -1 });
            const now = new Date();

            const notifications = tasks
                .filter((task) => taskStatus(task) !== "completed" && task.dueDate)
                .map((task) => {
                    const dueDate = new Date(task.dueDate);
                    const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

                    if (diffDays < 0) {
                        return {
                            type: "overdue",
                            title: task.title,
                            message: `Task "${task.title}" is overdue.`,
                            dueDate: task.dueDate,
                        };
                    }

                    if (diffDays <= 2) {
                        return {
                            type: "upcoming",
                            title: task.title,
                            message: `Task "${task.title}" is due in ${diffDays} day(s).`,
                            dueDate: task.dueDate,
                        };
                    }

                    return null;
                })
                .filter(Boolean);

            return {
                total: notifications.length,
                notifications,
            };
        }

        static async getTaskComments(user,id,role){
            const task = await TaskModel.findOne({ _id: id, ...taskVisibilityFilter(user,role) })
                .populate("comments.user", "name email");
            if(!task){
                throw new ApiError(httpStatus.NOT_FOUND,"Task Not Found")
            }

            return {
                comments: task.comments
            }
        }

        static async addTaskComment(user,id,text,role){
            await this.getAccessibleTask(user,id,role);
            const task = await TaskModel.findOneAndUpdate(
                { _id: id, ...taskVisibilityFilter(user,role) },
                { $push: { comments: { user, text } } },
                { new: true, runValidators: true }
            ).populate("comments.user", "name email");
            if(!task){
                throw new ApiError(httpStatus.NOT_FOUND,"Task Not Found")
            }

            return {
                msg: "Comment Added",
                comments: task.comments
            }
        }

        static async getAccessibleTask(user,id,role){
            const task = await TaskModel.findOne({ _id: id, ...taskVisibilityFilter(user,role) });
            if(!task){
                throw new ApiError(httpStatus.NOT_FOUND,"Task Not Found")
            }
            return task;
        }

        static async addTaskAttachments(user,id,files,role){
            if(files.length > 10){
                throw new ApiError(httpStatus.BAD_REQUEST,"A task can have up to 10 attachments")
            }

            const attachments = files.map((file) => ({
                uploadedBy: user,
                storageName: file.filename,
                originalName: path.basename(file.originalname.replace(/\\/g, "/")).slice(0,255),
                mimeType: file.mimetype,
                size: file.size
            }));
            const task = await TaskModel.findOneAndUpdate(
                {
                    _id: id,
                    ...taskVisibilityFilter(user,role),
                    $expr: {
                        $lte: [
                            { $size: { $ifNull: ["$attachments", []] } },
                            10 - files.length
                        ]
                    }
                },
                { $push: { attachments: { $each: attachments } } },
                { new: true, runValidators: true }
            );
            if(!task){
                const accessibleTask = await TaskModel.exists({ _id: id, ...taskVisibilityFilter(user,role) });
                if(!accessibleTask){
                    throw new ApiError(httpStatus.NOT_FOUND,"Task Not Found")
                }
                throw new ApiError(httpStatus.BAD_REQUEST,"A task can have up to 10 attachments")
            }

            return {
                msg: "Attachments uploaded",
                attachments: task.attachments.map((attachment) => ({
                    _id: attachment._id,
                    originalName: attachment.originalName,
                    mimeType: attachment.mimeType,
                    size: attachment.size,
                    uploadedBy: attachment.uploadedBy,
                    createdAt: attachment.createdAt
                }))
            };
        }

        static async getTaskAttachment(user,id,attachmentId,role){
            const task = await this.getAccessibleTask(user,id,role);
            const attachment = task.attachments.id(attachmentId);
            if(!attachment){
                throw new ApiError(httpStatus.NOT_FOUND,"Attachment Not Found")
            }

            return attachment;
        }

        static async deleteTaskAttachment(user,id,attachmentId,role){
            const task = await TaskModel.findOneAndUpdate(
                { _id: id, ...taskVisibilityFilter(user,role), "attachments._id": attachmentId },
                { $pull: { attachments: { _id: attachmentId } } },
                { new: false }
            );
            const attachment = task?.attachments.id(attachmentId);
            if(!attachment){
                throw new ApiError(httpStatus.NOT_FOUND,"Attachment Not Found")
            }
            return { storageName: attachment.storageName };
        }

        static async deleteById(id){
            const tasks = await TaskModel.findOneAndDelete({_id:id});
                if(!tasks){
                    throw new ApiError(httpStatus.BAD_REQUEST,"Task Not Found")
                }

                await removeStoredFiles((tasks.attachments || []).map((attachment) => attachment.storageName));
                return {
                    msg:"Task Deleted"
                }
          
        }

         static async editTaskById(user,id,role,updates){
            const task = await this.getAccessibleTask(user,id,role);
            if(role !== "admin" && !getTaskAssigneeIds(task).includes(String(user))){
                throw new ApiError(httpStatus.FORBIDDEN,"Editors can only update tasks assigned to them")
            }
            if(Object.prototype.hasOwnProperty.call(updates,"assignee") || Object.prototype.hasOwnProperty.call(updates,"assignees")){
                if(role !== "admin"){
                    throw new ApiError(httpStatus.FORBIDDEN,"Only administrators can change task assignments")
                }
                const assigneeIds = [...new Set(updates.assignees || (updates.assignee ? [updates.assignee] : []))];
                if(assigneeIds.length){
                    const editors = await UserModel.find({ _id: { $in: assigneeIds }, role: "editor" }).select("_id");
                    if(editors.length !== assigneeIds.length){
                        throw new ApiError(httpStatus.BAD_REQUEST,"Tasks can only be assigned to editor accounts")
                    }
                }
                updates.assignees = assigneeIds;
            }
            const allowedUpdates = {};
            ["title","description","dueDate","priority","status","assignees"].forEach((field) => {
                if(Object.prototype.hasOwnProperty.call(updates,field)){
                    allowedUpdates[field] = updates[field];
                }
            });
            if(Object.prototype.hasOwnProperty.call(allowedUpdates,"assignees")){
                allowedUpdates.assignee = null;
            }
            if(Object.prototype.hasOwnProperty.call(allowedUpdates,"status")){
                allowedUpdates.isComplete = allowedUpdates.status === "completed";
            }
            const tasks = await TaskModel.findOneAndUpdate(
                { _id:id, ...taskVisibilityFilter(user,role) },
                { $set: allowedUpdates },
                { new:true, runValidators:true }
            );
                if(!tasks){
                    throw new ApiError(httpStatus.BAD_REQUEST,"Task Not Found")
                }

                return {
                    msg:"Task Updated",
                    task: {
                        ...tasks.toObject(),
                        status: taskStatus(tasks),
                        isComplete: taskStatus(tasks) === "completed"
                    }
                }
            }

        
}

module.exports = TaskService