const Notification = require('../models/Notification');
const User = require('../models/User');

exports.sendNotification = async (req, res) => {
  const { receiverId } = req.body; // The user being added

  if (!receiverId) {
    return res.status(400).json({ error: "Receiver ID is required" });
  }

  try {
    // Check if notification already exists
    const existingNotification = await Notification.findOne({
      senderId: req.userId,
      receiverId,
      type: 'add_request',
      status: 'pending',
    });

    if (existingNotification) {
      return res
        .status(409)
        .json({ error: "A pending add request already exists." });
    }

    // Create a new notification
    const newNotification = new Notification({
      senderId: req.userId,
      receiverId,
      type: 'add_request',
    });

    await newNotification.save();

    res.status(201).json({ message: 'Add request sent successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send notification.' });
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ receiverId: req.userId, status: 'pending' })
      .populate('senderId', 'username')
      .sort({ timestamps: -1 });

    res.json(
      notifications.map((notif) => ({
        id: notif._id,
        senderUsername: notif.senderId.username,
        senderId: notif.senderId._id,
      }))
    );
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

exports.handleNotificationAction = async (req, res) => {
  const { id, action } = req.params;
  try {
    const notification = await Notification.findById(id);
    if (!notification) return res.status(404).json({ error: 'Notification not found' });

    if (action === 'accepted') {
      let user = await User.findById(notification.receiverId);
      if (!user.contacts.includes(notification.senderId)) {
        user.contacts.push(notification.senderId);
        await user.save();
      }
      user = await User.findById(notification.senderId);
      if (!user.contacts.includes(notification.receiverId)) {
        user.contacts.push(notification.receiverId);
        await user.save();
      }
    }

    notification.status = action;
    await notification.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to handle notification action' });
  }
};
