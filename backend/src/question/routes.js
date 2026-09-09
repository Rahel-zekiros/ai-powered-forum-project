import express from 'express';
import { getQuestionsController, searchQuestionsSemanticController } from './controller.js';
import { authenticateUser } from '../middleware/authentication.js';

const questionRouter = express.Router();

// Semantic Search Questions
questionRouter.get('/search', authenticateUser, searchQuestionsSemanticController);

// List Questions (with keyword search and mine filter)
questionRouter.get('/', authenticateUser, getQuestionsController);

export default questionRouter;
