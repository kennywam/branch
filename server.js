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

// Adjust the schema to match the MongoDB field names
const messagingSchema = new mongoose.Schema({
  userId: String, // Adjust to match the field name in your MongoDB collection
  messageBody: String,
  timestamp: { type: Date, default: Date.now },
});

const Message = mongoose.model('Message', messagingSchema);

app.use(bodyParser.json());

app.get('/messages', async (req, res) => {
  const { userId } = req.query;

  // Adjust the field name in the query
  const messages = await Message.find({ 'User ID': userId }).sort({ timestamp: 1 });
  res.json(messages);
});

app.post('/respond', async (req, res) => {
  const { userId, messageBody } = req.body;

  const newMessage = new Message({ 'User ID': userId, messageBody });
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
