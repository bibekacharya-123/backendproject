import { asyncHandler } from "../middlewares/asyncHandler";

import apiError from "../utils/apiError";
import { Users } from "../models/user.model.js";
export { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessTokenaAndRefreshToken = async (userId) => {
  try {
    const user = await Users.findById(userId);
    const accessToken = user.generateAceessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new apiError(500, "Failed to generate tokens");
  }
};
// get user details
//validation
// check if user exists
//check for images and avatar
//upload them to cloudnary
//create user objects for mongodb
//create entry in db
//remove password and refresh token from response
//check for usercreation and send response
const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, username, password } = req.body;
  console.log("email", email);

  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new apiError(400, "Full name is required");
  }

  const exitsedUser = Users.findOne({
    $or: [{ email }, { username }],
  }).then((user) => {
    if (exitsedUser) {
      throw new apiError(409, "User already exists");
    }
  });

  const avatarLocalPath = req.files?.avatar[0].path;
  const coverImageLocalPath = req.files?.coverImage[0].path;

  if (!avatarLocalPath) {
    throw new apiError(400, "Avatar and cover image are required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new apiError(500, "Failed to upload images");
  }

  const user = await Users.create({
    fullName,
    email,
    username,
    password,
    avatar: avatar.url,
    coverImage: coverImage.url || null,
  });
  const createdUser = await Users.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new apiError(500, "Failed to create user");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, "User created", createdUser));
});

const loginUser = asyncHandler(async (req, res) => {
  //req body data

  const { email, username, password } = req.body;

  if (!username || !email) {
    throw new apiError(400, "Username or email is required");
  }

  const user = await Users.findOne({ $or: [{ email }, { username }] }).then(
    (user) => {
      if (!user) {
        throw new apiError(404, "User not found");
      }
      return user;
    }
  );
  //username or email
  //find user
  //password check

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new apiError(401, "Invalid credentials");
  }
  //access token or refresh token
  const { accessToken, refreshToken } =
    await generateAccessTokenaAndRefreshToken(user._id);

  //send cookie

  const loggedInUser = await Users.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        "User logged in",
        loggedInUser,
        accessToken,
        refreshToken
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  Users.findByIdAndUpdate(req.user._id, {
    $set: { refreshToken: undefined },
  });
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, "User logged out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incommingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
    if (!incommingRefreshToken) {
        throw new apiError(401, "Unauthorized");
    }

    const decodedToken = jwt.verify(
        incommingRefreshToken,
        process.env.REFRESH_TOKEN_SECRET,
    )

    const user = await Users.findById(decodedToken?._id);
    if(!user){
        throw new apiError(401, "Unauthorized refresh token ");
    }
    if(user.refreshToken !== incommingRefreshToken){
        throw new apiError(401, "Unauthorized refresh token ");
    }

    const options = {
        httpOnly: true,
        secure: true,
    }
   const {newAccessToken,newRefreshToken}= await generateAccessTokenaAndRefreshToken(user._id).then(({accessToken, refreshToken}) => {
        return res
        .status(200)
        .cookie("accessToken", newAccessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(new ApiResponse(200, "Access token refreshed"));
    }).catch(error => {
        throw new apiError(500, error.message);
    })

});

export { registerUser, loginUser, logoutUser ,refreshAccessToken};
