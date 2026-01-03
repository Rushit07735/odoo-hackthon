import express from 'express';
import {
  getAllSkills,
  getSkillById,
  createSkill,
  updateSkill,
  deleteSkill
} from '../controllers/skillController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateSkill, validateId, validatePagination } from '../middleware/validation.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

router.get('/', validatePagination, getAllSkills);
router.get('/:id', validateId, getSkillById);
router.post('/', validateSkill, createSkill);
router.put('/:id', validateId, validateSkill, updateSkill);
router.delete('/:id', validateId, deleteSkill);

export default router;


