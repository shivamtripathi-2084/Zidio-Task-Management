const { ApiError } = require("../utils/ApiError");
const multer = require("multer")

const ErrorHandling = (err,req,res,next)=>{
            if(res.headersSent){
                return next(err)
            }
            const obj = {
                'statusCode':500
            }
               if(err instanceof ApiError){
                obj['statusCode'] = err.statusCode
                 obj['message'] = err.message;
                obj['stack'] = err.stack;
               }else if(err instanceof multer.MulterError){
                obj['statusCode'] = err.code === "LIMIT_FILE_SIZE" ? 413 : 400
                obj['message'] = err.code === "LIMIT_FILE_SIZE"
                    ? "Each attachment must be 10 MB or smaller"
                    : "Upload no more than 5 files at a time using the files field"
                obj['stack'] = err.stack;
               }else{
                   obj['message'] = err.message;
                obj['stack'] = err.stack;
               }
               res.status(obj.statusCode).send(obj)

}

module.exports = ErrorHandling