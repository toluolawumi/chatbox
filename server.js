const path = require('path');
const express = require('express');
const app = express();

const socketio = require('socket.io')
const formatMessage = require('./utils/messages')
const {userJoin, getCurrentUser, userLeave, getRoomUsers} = require('./utils/users')
const admin = "Admin"

//set static folder
app.use(express.static(path.join(__dirname, 'public')));

require('dotenv').config();
const port = process.env.PORT || 4000;

const server = app.listen(port, () => {
    console.log(`server running on port ${port}`)
})

const io = socketio(server)

//run when client connects
io.on('connection', socket => {
    //when user joins a room, listen to event from client
    socket.on('joinRoom', ({username, room}) => {

        const user = userJoin(socket.id, username, room)
        socket.join(user.room);

        //welcome current user
        socket.emit('message', formatMessage(admin, "Welcome to chatbox"))

        //broadcast when a user connects
        socket.broadcast.to(user.room).emit('message', formatMessage(admin, `${user.username} has joined the chat`));

        //send users and room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        })

    })

    //listen for chat message
    socket.on('chatMessage', (msg) => {
        const user = getCurrentUser(socket.id)
        io.to(user.room).emit('message',formatMessage(`${user.username}`, msg))
    })

    //runs when client disconnects
    socket.on('disconnect', () => {
        const user = userLeave(socket.id)
         if (user){
            io.to(user.room).emit('message', formatMessage(admin, `${user.username} has left the chat`))
         

        //send users and room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        })
        }
        
    })
})
