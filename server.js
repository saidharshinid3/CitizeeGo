require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const cors = require('cors');

const connectDB = require('./config/db');


// ROUTES

const userRoutes = require('./routes/userRoutes');

const authRoutes = require('./routes/authRoutes');

const complaintRoutes = require('./routes/complaintRoutes');


// CONNECT DATABASE

connectDB();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

app.set('io', io);

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
});


// MIDDLEWARE

app.use(cors());

app.use(express.json());


// ROUTES

app.use('/api/users', userRoutes);

app.use('/api/auth', authRoutes);

app.use('/api/complaints', complaintRoutes);


// TEST ROUTE

app.get('/', (req, res) => {

  res.send('CitizeeGo API running');

});


// PORT

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {

  console.log(`Server running on port ${PORT}`);

});