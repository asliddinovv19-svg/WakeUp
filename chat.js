const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Message = require('../models/Message');
const User = require('../models/User');

// GET /api/chat/:type - Get messages
// type: personal, city, region, country, world
router.get('/:type', auth, async (req, res) => {
  try {
    const { type } = req.params;
    const { recipientId, page = 1, limit = 50 } = req.query;
    
    let query = { chatType: type };

    if (type === 'personal') {
      if (!recipientId) return res.status(400).json({ message: 'recipientId required' });
      query = {
        chatType: 'personal',
        $or: [
          { sender: req.user._id, recipient: recipientId },
          { sender: recipientId, recipient: req.user._id }
        ]
      };
    } else if (type === 'city') {
      query.location = { city: req.user.city };
    } else if (type === 'region') {
      query['location.region'] = req.user.region;
    } else if (type === 'country') {
      query['location.country'] = req.user.country;
    }
    // world = no filter

    const messages = await Message.find(query)
      .populate('sender', 'username avatar')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    res.json({ messages: messages.reverse() });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/chat/send - Send message
router.post('/send', auth, async (req, res) => {
  try {
    const { content, chatType, recipientId } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Message cannot be empty' });
    }

    if (content.length > 1000) {
      return res.status(400).json({ message: 'Message too long' });
    }

    const messageData = {
      sender: req.user._id,
      content: content.trim(),
      chatType,
      location: {
        city: req.user.city,
        region: req.user.region,
        country: req.user.country
      }
    };

    if (chatType === 'personal') {
      if (!recipientId) return res.status(400).json({ message: 'recipientId required' });
      messageData.recipient = recipientId;
    }

    const message = new Message(messageData);
    await message.save();
    
    await message.populate('sender', 'username avatar');

    res.json({ message: 'Message sent', data: message });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/chat/users/search - Search users for personal chat
router.get('/users/search', auth, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json({ users: [] });

    const users = await User.find({
      username: { $regex: q, $options: 'i' },
      _id: { $ne: req.user._id },
      isVerified: true
    }).select('username avatar city').limit(10);

    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
