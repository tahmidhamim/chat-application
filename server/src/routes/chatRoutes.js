const express = require('express');
const {
  getSortedContacts,
  addContact,
  getMessages,
  sendMessage,
  searchUsers,
} = require('../controllers/chatController');
const authMiddleware = require('../middlewares/authMiddleware');
const router = express.Router();

router.get('/contacts', authMiddleware, getSortedContacts);
router.post('/contacts', authMiddleware, addContact);
router.get('/messages/:contactId', authMiddleware, getMessages);
router.post('/messages', authMiddleware, sendMessage);
router.get('/users/search', authMiddleware, searchUsers);

module.exports = router;
