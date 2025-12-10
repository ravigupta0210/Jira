const express = require('express');
const authRoutes = require('./authRoutes');
const projectRoutes = require('./projectRoutes');
const ticketRoutes = require('./ticketRoutes');
const meetingRoutes = require('./meetingRoutes');
const notificationRoutes = require('./notificationRoutes');
const dashboardRoutes = require('./dashboardRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/projects', projectRoutes);
router.use('/tickets', ticketRoutes);
router.use('/meetings', meetingRoutes);
router.use('/notifications', notificationRoutes);
router.use('/dashboard', dashboardRoutes);

module.exports = router;
