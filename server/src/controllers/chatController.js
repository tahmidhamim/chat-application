const User = require('../models/User');
const Message = require('../models/Message');

exports.getSortedContacts = async (req, res) => {
  try {
    const currentUserId = req.userId;

    // Fetch the user's contacts
    const user = await User.findById(currentUserId).populate('contacts');
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // For each contact, fetch the most recent message between the user and the contact
    const contactsWithMessages = await Promise.all(
      user.contacts.map(async (contact) => {
        const recentMessage = await Message.findOne({
          $or: [
            { sender: currentUserId, receiver: contact._id },
            { sender: contact._id, receiver: currentUserId },
          ],
        })
          .sort({ timestamp: -1 })
          .limit(1);

        return {
          contact,
          recentMessageTimestamp: recentMessage ? recentMessage.timestamp : null,
        };
      })
    );

    // Sort contacts by recent message timestamp (most recent first)
    const sortedContacts = contactsWithMessages
      .sort((a, b) => {
        const timestampA = a.recentMessageTimestamp || 0;
        const timestampB = b.recentMessageTimestamp || 0;
        return timestampB - timestampA; // Descending order
      })
      .map((entry) => entry.contact);

    res.json(sortedContacts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch contacts.' });
  }
};

exports.addContact = async (req, res) => {
  const { contactId } = req.body;
  try {
    const user = await User.findById(req.userId);
    if (!user.contacts.includes(contactId)) {
      user.contacts.push(contactId);
      await user.save();
    }
    res.json({ message: 'Contact added' });
  } catch (error) {
    res.status(400).json({ error: 'Failed to add contact' });
  }
};

exports.getMessages = async (req, res) => {
  const { contactId } = req.params;
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.userId, receiver: contactId },
        { sender: contactId, receiver: req.userId },
      ],
    }).sort('timestamp');
    res.json(messages);
  } catch (error) {
    res.status(400).json({ error: 'Failed to fetch messages' });
  }
};

exports.sendMessage = async (req, res) => {
  const { receiver, content } = req.body;
  try {
    const message = new Message({ sender: req.userId, receiver, content });
    await message.save();
    res.status(201).json(message);
  } catch (error) {
    res.status(400).json({ error: 'Failed to send message' });
  }
};

exports.searchUsers = async (req, res) => {
  const { username } = req.query;
  try {
    const users = await User.find({
      username: { $regex: username, $options: 'i' },
    }).select('_id username'); // Return only _id and username
    
    const currentUserId = req.userId;

    // Exclude current user
    const filteredUsers = users.filter((user) => user._id.toString() !== currentUserId);

    res.json(filteredUsers);
  } catch (error) {
    res.status(400).json({ error: 'Failed to search users' });
  }
};
