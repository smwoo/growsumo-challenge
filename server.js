const server = require('socket.io')();
const express = require('express');
const firstTodos = require('./data');
const Todo = require('./todo');
const path = require('path');

server.on('connection', (client) => {
    // This is going to be our fake 'database' for this application
    // Parse all default Todo's from db

    // FIXME: DB is reloading on client refresh. It should be persistent on new client
    // connections from the last time the server was run...
    const DB = firstTodos.map((t) => {
        // Form new Todo objects
        return new Todo(title=t.title);
    });

    // Sends a message to the client to reload all todos
    const initialLoadTodos = () => {
        server.emit('load', DB);
    }
    // Send the DB downstream on connect
    initialLoadTodos();

    const updateTodos = (newTodo) => {
        server.emit('update', newTodo);
    }

    // Accepts when a client makes a new todo
    client.on('make', (t) => {
        // Make a new todo
        const newTodo = new Todo(title=t.title);

        // Push this newly created todo to our database
        DB.push(newTodo);

        // Send the latest todos to the client
        // FIXME: This sends all todos every time, could this be more efficient?
        updateTodos(newTodo);
    });


});

console.log('Waiting for clients to connect');
server.listen(3003);

const app = express();

app.use(express.static('public'));

app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Production Express server running at localhost:${PORT}`);
});
