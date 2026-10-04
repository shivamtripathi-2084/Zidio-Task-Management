const httpStatus = require("http-status").default || require("http-status");
const TaskService = require("../services/Task.service");
const CatchAsync = require("../utils/CatchAsync");
const fs = require("fs/promises");
const { getStoredFilePath, removeStoredFiles } = require("../utils/taskAttachmentStorage");
const { ApiError } = require("../utils/ApiError");

class TaskController{

           
                    static addTask  = CatchAsync(async(req,res)=>{
                        const res_obj = await TaskService.addTask(req.body,req.user);
                        res.status(httpStatus.CREATED).send(res_obj)
                    })
            

                    static getAllTask =   CatchAsync(async(req,res)=>{
                        const res_obj = await TaskService.getAllTask(req.user,req.userRole);
                        res.status(httpStatus.OK).send(res_obj)
                    })

                    static getTaskStats = CatchAsync(async(req,res)=>{
                        const stats = await TaskService.getTaskStats(req.user,req.userRole);
                        res.status(httpStatus.OK).send({ stats })
                    })

                    static getTaskNotifications = CatchAsync(async(req,res)=>{
                        const notifications = await TaskService.getTaskNotifications(req.user,req.userRole);
                        res.status(httpStatus.OK).send(notifications)
                    })
                    static getTaskComments = CatchAsync(async(req,res)=>{
                        const comments = await TaskService.getTaskComments(req.user,req.params.id,req.userRole);
                        res.status(httpStatus.OK).send(comments)
                    })
                    static addTaskComment = CatchAsync(async(req,res)=>{
                        const result = await TaskService.addTaskComment(req.user,req.params.id,req.body.text,req.userRole);
                        res.status(httpStatus.CREATED).send(result)
                    })
                    static authorizeTaskAccess = CatchAsync(async(req,_res,next)=>{
                        await TaskService.getAccessibleTask(req.user,req.params.id,req.userRole);
                        next();
                    })
                    static addTaskAttachments = CatchAsync(async(req,res)=>{
                        const files = req.files || [];
                        if(files.length === 0){
                            throw new ApiError(httpStatus.BAD_REQUEST,"Select at least one file to upload")
                        }

                        let result;
                        try {
                            result = await TaskService.addTaskAttachments(req.user,req.params.id,files,req.userRole);
                        } catch(error) {
                            try {
                                await removeStoredFiles(files.map((file) => file.filename));
                            } catch(cleanupError) {
                                console.error("Failed to clean up rejected task attachments", cleanupError);
                            }
                            throw error;
                        }

                        res.status(httpStatus.CREATED).send(result)
                    })
                    static downloadTaskAttachment = CatchAsync(async(req,res,next)=>{
                        const attachment = await TaskService.getTaskAttachment(req.user,req.params.id,req.params.attachmentId,req.userRole);
                        const filePath = getStoredFilePath(attachment.storageName);
                        try {
                            await fs.access(filePath);
                        } catch(error) {
                            if(error.code === "ENOENT"){
                                throw new ApiError(httpStatus.NOT_FOUND,"Attachment file not found")
                            }
                            throw error;
                        }

                        res.set("X-Content-Type-Options","nosniff");
                        res.download(filePath,attachment.originalName,{ headers: { "Content-Type": "application/octet-stream" } },(error)=>{
                            if(error){
                                next(error);
                            }
                        })
                    })
                    static deleteTaskAttachment = CatchAsync(async(req,res)=>{
                        const { storageName } = await TaskService.deleteTaskAttachment(req.user,req.params.id,req.params.attachmentId,req.userRole);
                        try {
                            await removeStoredFiles([storageName]);
                        } catch(error) {
                            console.error("Attachment metadata was removed but its local file could not be deleted", error);
                            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR,"Attachment removed, but local file cleanup failed")
                        }
                        res.status(httpStatus.OK).send({ msg: "Attachment deleted" })
                    })
                      static deleteById =   CatchAsync(async(req,res)=>{
                        const res_obj = await TaskService.deleteById(req?.params?.id);
                        res.status(httpStatus.OK).send(res_obj)
                    })


                          static editTaskById =   CatchAsync(async(req,res)=>{
                        const res_obj = await TaskService.editTaskById(req.user,req?.params?.id,req.userRole,req.body);
                        res.status(httpStatus.OK).send(res_obj)
                    })
}

module.exports = TaskController