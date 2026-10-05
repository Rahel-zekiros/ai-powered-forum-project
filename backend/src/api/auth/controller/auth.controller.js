import { StatusCodes } from "http-status-codes";
import {
  createNewUserAccount,
  authenticateUserAccount,
  fetchUserProfile,
  updateUserPassword,
} from "../service/auth.service.js";
export const handleUserRegistration = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    const createdUser = await createNewUserAccount({
      firstName,
      lastName,
      email,
      password,
    });
    res.status(StatusCodes.CREATED).json({
      success: true,
      message: "User account created successfully.",
      user: createdUser,
    });
  } catch (error) {
    next(error);
  }
};
export const handleUserLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { user, accessToken } = await authenticateUserAccount({
      email,
      password,
    });
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Authentication successful.",
      user,
      token: accessToken,
    });
  } catch (error) {
    next(error);
  }
};
export const handleFetchCurrentUser = async (req, res, next) => {
  try {
    const activeUserId = req.user.id;
    const profile = await fetchUserProfile(activeUserId);
    res.status(StatusCodes.OK).json({
      success: true,
      user: profile,
    });
  } catch (error) {
    next(error);
  }
};

export const handleUpdatePassword = async (req, res, next) => {
  try {
    await updateUserPassword({
      userId: req.user.id,
      currentPassword: req.body.currentPassword,
      newPassword: req.body.newPassword,
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Password changed successfully.",
    });
  } catch (error) {
    next(error);
  }
};
