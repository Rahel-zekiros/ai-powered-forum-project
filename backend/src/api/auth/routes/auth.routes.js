import express from 'express';
import {
  handleUserRegistration,
  handleUserLogin,
  handleFetchCurrentUser,
  handleUpdatePassword,
} from '../controller/auth.controller.js';
import {
  validateUserRegistration,
  validateUserLogin,
  validatePasswordChange,
} from '../validations/auth.validation.js';
import { authenticateUser } from '../../../middleware/authentication.js';

const router = express.Router();

router.post('/register', validateUserRegistration, handleUserRegistration);

router.post('/login', validateUserLogin, handleUserLogin);
router.get('/me', authenticateUser, handleFetchCurrentUser);
router.put(
  '/password',
  authenticateUser,
  validatePasswordChange,
  handleUpdatePassword,
);

export default router;