const express = require('express');
const { body } = require('express-validator');
const { authMiddleware } = require('../middleware/auth');
const meetingController = require('../controllers/meetingController');

const router = express.Router();

router.use(authMiddleware);

router.post('/', [
  body('title').notEmpty().withMessage('Meeting title is required'),
  body('startTime').notEmpty().withMessage('Start time is required'),
  body('endTime').notEmpty().withMessage('End time is required')
], meetingController.createMeeting);

router.get('/', meetingController.getMeetings);
router.get('/upcoming', meetingController.getUpcomingMeetings);
router.get('/:id', meetingController.getMeeting);
router.put('/:id', meetingController.updateMeeting);
router.delete('/:id', meetingController.deleteMeeting);

router.post('/:id/respond', [
  body('status').isIn(['accepted', 'declined', 'tentative']).withMessage('Invalid response status')
], meetingController.respondToMeeting);

router.post('/:id/participants', meetingController.addParticipants);

module.exports = router;
