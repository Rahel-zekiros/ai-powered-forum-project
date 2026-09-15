import express from 'express';
import {
  handleUserRegistration,
  handleUserLogin,
  handleFetchCurrentUser,
} from '../controller/auth.controller.js';
import {
  validateUserRegistration,
  validateUserLogin,
} from '../validations/auth.validation.js';
import { authenticateUser } from '../../../middleware/authentication.js';

const router = express.Router();

router.post('/register', validateUserRegistration, handleUserRegistration);

router.post('/login', validateUserLogin, handleUserLogin);
router.get('/me', authenticateUser, handleFetchCurrentUser);

export default router;