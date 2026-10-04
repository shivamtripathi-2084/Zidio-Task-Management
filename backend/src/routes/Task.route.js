const express = require("express")
const router =express.Router()
const ValidationError = require("../middlwares/ValidationError")
const AuthValidator = require("../middlwares/AuthValidator")
const RoleValidator = require("../middlwares/RoleValidator")
const TaskValidation = require("../validations/Task.validation")
const TaskController = require("../controllers/Task.controller")
const TaskAttachmentUpload = require("../middlwares/TaskAttachmentUpload")

router.use(AuthValidator)

router.route("/add")
.post(TaskValidation.AddTask,ValidationError, RoleValidator(["admin"]), TaskController.addTask)



router.route("/get-all")
.get(RoleValidator(["admin","editor","viewer"]),TaskController.getAllTask)

router.route("/stats")
.get(RoleValidator(["admin","editor","viewer"]),TaskController.getTaskStats)

router.route("/notifications")
.get(RoleValidator(["admin","editor","viewer"]),TaskController.getTaskNotifications)

router.route("/:id/comments")
.get(TaskValidation.paramsId,ValidationError,RoleValidator(["admin","editor","viewer"]),TaskController.getTaskComments)
.post(TaskValidation.paramsId,TaskValidation.AddTaskComment,ValidationError,RoleValidator(["admin","editor"]),TaskController.addTaskComment)

router.route("/:id/attachments")
.post(TaskValidation.paramsId,ValidationError,RoleValidator(["admin", "editor"]),TaskController.authorizeTaskAccess,TaskAttachmentUpload.array("files",5),TaskController.addTaskAttachments)

router.route("/:id/attachments/:attachmentId")
.get(TaskValidation.paramsAttachment,ValidationError,RoleValidator(["admin","editor","viewer"]),TaskController.downloadTaskAttachment)
.delete(TaskValidation.paramsAttachment,ValidationError,RoleValidator(["admin", "editor"]),TaskController.authorizeTaskAccess,TaskController.deleteTaskAttachment)



router.route("/delete/:id")
.delete(TaskValidation.paramsId,ValidationError, RoleValidator(["admin"]), TaskController.deleteById)




router.route("/edit/:id")
.put(TaskValidation.paramsId,TaskValidation.UpdateTask,ValidationError,RoleValidator(["admin", "editor"]),TaskController.editTaskById)
module.exports = router