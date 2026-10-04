const { body, param } = require("express-validator")
class AuthValidation {

    static registerUser = [
        body("name").notEmpty().withMessage("Please provide valid name"),
        body("email").notEmpty().withMessage("Please provide valid Email").isEmail().withMessage("email should be valid"),
        body("password").notEmpty().withMessage("password is required")
    ]
     static loginUser = [ 
        body("email").notEmpty().withMessage("Please provide valid Email").isEmail().withMessage("email should be valid"),
        body("password").notEmpty().withMessage("password is required")
    ]

     static updateUserRole = [
         param("id").isMongoId().withMessage("Please provide a valid user id"),
         body("role").isIn(["admin", "editor", "viewer"]).withMessage("Role must be admin, editor, or viewer")
     ]

    
}
module.exports =AuthValidation