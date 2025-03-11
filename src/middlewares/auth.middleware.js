import ApiError from "../utils/apiError";
import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler";
import { Users } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
    const accessToken = req.cookies?.accessToken || req.headers["authorization"]?.replace("Bearer ", "");

    if (!accessToken) {
        return res.status(401).json(new ApiError(401, "Unauthorized"));
    }

    try {
        const decodedToken = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
        const user = await Users.findById(decodedToken?._id).select("-password -refreshToken");

        if (!user) {
            return res.status(401).json(new ApiError(401, "Unauthorized"));
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json(new ApiError(401, "Invalid token"));
    }
});
