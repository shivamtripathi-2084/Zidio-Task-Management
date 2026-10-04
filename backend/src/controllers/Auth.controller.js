const httpStatus = require("http-status").default || require("http-status");
const AuthService = require("../services/Auth.service");
const CathcAsync = require("../utils/CatchAsync");

class AuthController{

            static registerUser = CathcAsync(async(req,res)=>{
                
                const res_obj = await AuthService.registerUser(req.body);
                res.status(httpStatus.CREATED).send(res_obj)
            })
               static loginUser = CathcAsync(async(req,res)=>{
                
                const res_obj = await AuthService.loginUser(req.body);
                res.status(httpStatus.OK).send(res_obj)
            })    
            static profileUser = CathcAsync(async(req,res)=>{
                
                const res_obj = await AuthService.profileUser(req?.user);
                res.status(httpStatus.OK).send(res_obj)
            })
            static getUsers = CathcAsync(async(_req,res)=>{
                const res_obj = await AuthService.getUsers();
                res.status(httpStatus.OK).send(res_obj)
            })
            static updateUserRole = CathcAsync(async(req,res)=>{
                const res_obj = await AuthService.updateUserRole(req.user,req.params.id,req.body.role);
                res.status(httpStatus.OK).send(res_obj)
            })

            
            
}

module.exports = AuthController