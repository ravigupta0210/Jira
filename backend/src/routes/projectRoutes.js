const express = require('express');
const { body } = require('express-validator');
const { authMiddleware } = require('../middleware/auth');
const projectController = require('../controllers/projectController');

const router = express.Router();

router.use(authMiddleware);

router.post('/', [
  body('name').notEmpty().withMessage('Project name is required'),
  body('key').notEmpty().isLength({ min: 2, max: 10 }).withMessage('Project key must be 2-10 characters')
], projectController.createProject);

router.get('/', projectController.getProjects);
router.get('/:id', projectController.getProject);
router.put('/:id', projectController.updateProject);
router.delete('/:id', projectController.deleteProject);

router.post('/:id/members', projectController.addMember);
router.delete('/:id/members/:userId', projectController.removeMember);

router.get('/:id/columns', projectController.getBoardColumns);
router.put('/:id/columns', projectController.updateBoardColumns);

module.exports = router;
