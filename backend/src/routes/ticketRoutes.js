const express = require('express');
const { body } = require('express-validator');
const { authMiddleware } = require('../middleware/auth');
const ticketController = require('../controllers/ticketController');

const router = express.Router();

router.use(authMiddleware);

router.post('/', [
  body('projectId').notEmpty().withMessage('Project ID is required'),
  body('title').notEmpty().withMessage('Title is required')
], ticketController.createTicket);

router.get('/', ticketController.getTickets);
router.get('/kanban/:projectId', ticketController.getKanbanBoard);
router.get('/:id', ticketController.getTicket);
router.put('/:id', ticketController.updateTicket);
router.delete('/:id', ticketController.deleteTicket);

router.put('/:id/move', ticketController.moveTicket);

router.post('/:id/comments', [
  body('content').notEmpty().withMessage('Comment content is required')
], ticketController.addComment);
router.put('/:id/comments/:commentId', ticketController.updateComment);
router.delete('/:id/comments/:commentId', ticketController.deleteComment);

module.exports = router;
