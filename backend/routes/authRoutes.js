import express from 'express';
import { login, getCurrentUser } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateLogin } from '../middleware/validation.js';

const router = express.Router();

router.post('/login', validateLogin, login);
router.get('/me', authenticateToken, getCurrentUser);

export default router;


