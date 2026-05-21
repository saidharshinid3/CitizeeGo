import { io } from 'socket.io-client';

const socket = io('https://citizeego-backend.onrender.com');

export default socket;
