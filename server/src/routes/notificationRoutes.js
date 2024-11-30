const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const {
  sendNotification,
  getNotifications,
  handleNotificationAction,
} = require('../controllers/notificationController');

const router = express.Router();

router.post('/', authMiddleware, sendNotification);
router.get('/', authMiddleware, getNotifications);
router.post('/:id/:action', authMiddleware, handleNotificationAction);

module.exports = router;
