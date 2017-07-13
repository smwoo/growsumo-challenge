const server = require('socket.io')();
const express = require('express');
const firstTodos = require('./data');
const Todo = require('./todo');
const path = require('path');

const DB = firstTodos.map(t =>
  // Form new Todo objects
  new Todo(t.title)
);

server.on('connection', (client) => {
  // This is going to be our fake 'database' for this application
  // Parse all default Todo's from db

  // Sends a message to the client to reload all todos
  const initialLoadTodos = () => {
    server.emit('load', DB);
  };
  // Send the DB downstream on connect
  initialLoadTodos();

  const createTodo = (newTodo) => {
    server.emit('new', newTodo);
  };

  const updateTodos = (updatedTodos) => {
    server.emit('update', updatedTodos);
  };

  const deleteTodo = (deletedTodos) => {
    server.emit('delete', deletedTodos);
  };

  // Accepts when a client makes a new todo
  client.on('make', (t) => {
    // Make a new todo
    const newTodo = new Todo(t.title);

    // Push this newly created todo to our database
    DB.push(newTodo);

    // send newly created todo back to all clients
    createTodo(newTodo);
  });

  // accepts when a client wants to toggle a task's completion
  client.on('toggle', (todo) => {
    const updatedTodo = DB.find(t => t.unique_hash === todo.unique_hash);
    updatedTodo.toggleCompleted();

    // send all updated tasks back to clients
    updateTodos([updatedTodo]);
  });

  // when a client wishes to delete a task(s)
  client.on('delete', (todos) => {
    const deletedTodos = [];
    for (const todo of todos) {
      const index = DB.findIndex(t => t.unique_hash === todo.unique_hash);
      if (index > -1) {
        deletedTodos.push(DB.splice(index, 1)[0]);
      }
    }

    // tell all clients which tasks have been deleted
    deleteTodo(deletedTodos);
  });

  // when a client wishes to set all tasks to complete
  client.on('completeAll', (todos) => {
    const updatedTodos = [];
    for (const todo of todos) {
      const updatedTodo = DB.find(t => t.unique_hash === todo.unique_hash);
      updatedTodo.complete();

      updatedTodos.push(updatedTodo);
    }

    // send all updated tasks back to clients
    updateTodos(updatedTodos);
  });

  // debugging tool used to close socket connection to test caching
  // client.on('dc', () => {
  //   server.close();
  // });
});

// set socket on port 3003
console.log('Waiting for clients to connect');
server.listen(3003);

const app = express();

// allow access to public files
app.use(express.static('public'));
app.use('/angularCookies', express.static(path.join(__dirname, 'node_modules/angular-cookies')));

// serve index.html to client
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
});

// set site to configured port or 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Production Express server running at localhost:${PORT}`);
});
