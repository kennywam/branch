const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const PORT = process.env.PORT || 3000;

// Enable CORS for all routes
app.use(cors());

mongoose.connect('mongodb://127.0.0.1:27017/branch', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const messagingSchema = new mongoose.Schema({
  userId: String,
  messageBody: String,
  timestamp: { type: Date, default: Date.now },
});

const Message = mongoose.model('Message', messagingSchema);

app.use(bodyParser.json());

// Modified endpoint to fetch messages based on userId
app.get('/messages', async (req, res) => {
  const { userId } = req.query;

  // Fetch messages with the specified userId from the database
  const messages = await Message.find({ userId }).sort({ timestamp: 1 });
  res.json(messages);
});

app.post('/respond', async (req, res) => {
  const { userId, messageBody } = req.body;

  const newMessage = new Message({ userId, messageBody });
  await newMessage.save();

  io.emit('newMessage', newMessage);

  res.json({ success: true, message: 'Response sent successfully.' });
});

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
