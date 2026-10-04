const { body ,param} = require("express-validator")

class TaskValidation {
        static AddTask =[
            body("title").notEmpty().withMessage("Please provide Task Title"),
            body("desc").notEmpty().withMessage("Please provide Task Description"),
            body("dueDate").optional({ nullable: true }).isISO8601().withMessage("Please provide valid due date"),
            body("priority").optional().isIn(["low", "medium", "high"]).withMessage("Priority must be low, medium, or high"),
            body("assignee").optional({ nullable: true }).isMongoId().withMessage("Assignee must be a valid user id"),
            body("assignees").optional().isArray({ max: 20 }).withMessage("Select no more than 20 editors"),
            body("assignees.*").optional().isMongoId().withMessage("Each assignee must be a valid user id"),
        ]
        static AddTaskComment =[
            body("text").trim().isLength({ min: 1, max: 1000 }).withMessage("Comment must be between 1 and 1000 characters"),
        ]
        static UpdateTask =[
            body("title").optional().trim().notEmpty().withMessage("Task title cannot be empty"),
            body("description").optional().trim().notEmpty().withMessage("Task description cannot be empty"),
            body("dueDate").optional({ nullable: true }).isISO8601().withMessage("Please provide valid due date"),
            body("priority").optional().isIn(["low", "medium", "high"]).withMessage("Priority must be low, medium, or high"),
            body("status").optional().isIn(["pending", "in-progress", "completed"]).withMessage("Status must be pending, in-progress, or completed"),
            body("assignee").optional({ nullable: true }).isMongoId().withMessage("Assignee must be a valid user id"),
            body("assignees").optional().isArray({ max: 20 }).withMessage("Select no more than 20 editors"),
            body("assignees.*").optional().isMongoId().withMessage("Each assignee must be a valid user id"),
        ]
         static paramsId =[
            param("id").isMongoId().withMessage("enter valid mongoid").notEmpty().withMessage("Please provide Task Id"), 
        ]
         static paramsAttachment =[
             param("id").isMongoId().withMessage("enter valid task id"),
             param("attachmentId").isMongoId().withMessage("enter valid attachment id"),
         ]
}

module.exports = TaskValidation