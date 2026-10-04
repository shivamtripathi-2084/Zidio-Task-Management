const httpStatus = require("http-status").default || require("http-status");
const { ApiError } = require("../utils/ApiError");
const { UserModel } = require("../models");

const RoleValidator = (allowedRoles = []) => {
    return async (req, res, next) => {
        try {
            const userId = req.user;

            if (!userId) {
                throw new ApiError(httpStatus.UNAUTHORIZED, "Please login first");
            }

            const user = await UserModel.findById(userId).select("role");

            if (!user) {
                throw new ApiError(httpStatus.UNAUTHORIZED, "User not found");
            }

            if (!allowedRoles.includes(user.role)) {
                throw new ApiError(httpStatus.FORBIDDEN, "You do not have permission to perform this action");
            }

            req.userRole = user.role;
            next();
        } catch (error) {
            next(error instanceof ApiError ? error : new ApiError(httpStatus.FORBIDDEN, error.message || "Access denied"));
        }
    };
};

module.exports = RoleValidator;
