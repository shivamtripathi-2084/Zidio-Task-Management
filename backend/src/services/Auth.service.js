const httpStatus = require("http-status").default || require("http-status");
const { UserModel } = require("../models")
const { ApiError } = require("../utils/ApiError");
const JWTService = require("../utils/jwt");

class AuthService{
     static async registerUser(body){ 
        const normalizedBody = {
            name: body.name,
            email: body.email?.toLowerCase?.() || body.email,
            password: body.password,
            role: "viewer"
        }

        const chk_user = await UserModel.findOne({email: normalizedBody.email});
        if(chk_user){
            throw new ApiError(httpStatus.BAD_REQUEST,"user Alredy exist")
        }

        await UserModel.create(normalizedBody);

        return {
            msg:"User Register Successfully"
        }


    }

     static async loginUser(body){ 
        
        const chk_user = await UserModel.findOne({email: body.email.toLowerCase()});
        if(!chk_user){
            throw new ApiError(httpStatus.BAD_REQUEST,"user not exist")
        }
 

                const isMatch = await chk_user.comparePassword(body.password)
  if(!isMatch){
            throw new ApiError(httpStatus.BAD_REQUEST,"Invalid Credentials")
        }
        const token  = JWTService.generateToken({userId:chk_user._id})

        return {
            msg:"User Login Successfully",
            token,
            role: chk_user.role,
        }


    }

    static async profileUser(user){ 
        
        const chk_user = await UserModel.findById(user);
        if(!chk_user){
            throw new ApiError(httpStatus.BAD_REQUEST,"user not exist")
        }
 
 

        return {
            msg:"User Profile Fetched",
            user:{
                name:chk_user.name,
                email:chk_user.email,
                role: chk_user.role,
            }
        }


    }

    static async getUsers(){
        const users = await UserModel.find({})
            .select("name email role createdAt")
            .sort({ createdAt: -1 });
        return {
            users: users.map((user) => ({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                createdAt: user.createdAt
            }))
        };
    }

    static async updateUserRole(actorId,targetId,role){
        if(String(actorId) === String(targetId)){
            throw new ApiError(httpStatus.BAD_REQUEST,"You cannot change your own role")
        }

        const user = await UserModel.findByIdAndUpdate(
            targetId,
            { role },
            { new: true, runValidators: true, select: "name email role createdAt" }
        );
        if(!user){
            throw new ApiError(httpStatus.NOT_FOUND,"User Not Found")
        }

        return {
            msg: "User role updated",
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                createdAt: user.createdAt
            }
        };
    }
}

module.exports = AuthService