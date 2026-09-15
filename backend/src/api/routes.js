import express from 'express';
import authRoutes from './auth/routes/auth.routes.js';
import questionRoutes from '../question/routes.js'
import  postQuestionRoutes from './Routes/questionRoutes.js'

export const mainRouter = express.Router();

// Authentication routes
mainRouter.use('/auth', authRoutes);

// dashboard question fetch
mainRouter.use('/questions', questionRoutes);

// post question routes
mainRouter.use('/questions', postQuestionRoutes);