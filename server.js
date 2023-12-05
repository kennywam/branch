const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
const PORT = process.env.PORT || 3000;

app.use(cors());

mongoose.connect('mongodb://127.0.0.1:27017/branch', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const messagingSchema = new mongoose.Schema({
  userId: String,
  messageBody: String,
  timestamp: { type: Date, default: Date.now },
  isResponse: { type: Boolean, default: false },
});

const Message = mongoose.model('Message', messagingSchema);

app.use(bodyParser.json());

app.get('/messages', async (req, res) => {
  try {
    const { userId } = req.query;

    // Fetch both messages and responses
    const messages = await Message.find({ userId, isResponse: { $ne: true } }).sort({ timestamp: 1 });
    const responses = await Message.find({ userId, isResponse: true }).sort({ timestamp: 1 });

    const allMessages = [...messages, ...responses];

    res.json(allMessages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/send-response', async (req, res) => {
  try {
    const { userId, responseBody } = req.body;
    const newResponse = new Message({ userId, messageBody: responseBody, isResponse: true });
    await newResponse.save();

    io.emit('newResponse', newResponse);

    res.json({ success: true, message: 'Response sent successfully.' });
  } catch (error) {
    console.error('Error sending response:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });

  socket.on('sendMessage', async (data) => {
    const { userId, messageBody } = data;
    const newMessage = new Message({ userId, messageBody });
    await newMessage.save();

    io.emit('newMessage', newMessage);
  });

  socket.on('sendResponse', async (data) => {
    const { userId, responseBody } = data;
    const newResponse = new Message({ userId, messageBody: responseBody });
    await newResponse.save();

    io.emit('newResponse', newResponse);
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
