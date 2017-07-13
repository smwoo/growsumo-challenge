const server = require('socket.io')();
const express = require('express');
const firstTodos = require('./data');
const Todo = require('./todo');
const path = require('path');

const DB = firstTodos.map((t) => {
    // Form new Todo objects
    return new Todo(title=t.title);
});

server.on('connection', (client) => {
    // This is going to be our fake 'database' for this application
    // Parse all default Todo's from db

    // Sends a message to the client to reload all todos
    const initialLoadTodos = () => {
        server.emit('load', DB);
    }
    // Send the DB downstream on connect
    initialLoadTodos();

    const createTodo = (newTodo) => {
        server.emit('new', newTodo);
    }

    const updateTodos = (updatedTodos) => {
        server.emit('update', updatedTodos);
    }

    const deleteTodo = (deletedTodos) => {
        server.emit('delete', deletedTodos);
    }

    // Accepts when a client makes a new todo
    client.on('make', (t) => {
        // Make a new todo
        const newTodo = new Todo(title=t.title);

        // Push this newly created todo to our database
        DB.push(newTodo);

        createTodo(newTodo);
    });

    client.on('toggle', (todo) => {
        updatedTodo = DB.find((t) => {
            return t.unique_hash == todo.unique_hash;
        })
        updatedTodo.toggleCompleted()

        updateTodos([updatedTodo])
    });

    client.on('delete', (todos) => {
        const deletedTodos = [];
        for (const todo of todos) {
            index = DB.findIndex((t) => {
                return t.unique_hash == todo.unique_hash;
            })
            if (index > -1) {
                deletedTodos.push(DB.splice(index, 1)[0]);
            }
        }
        deleteTodo(deletedTodos);
    });

    client.on('completeAll', (todos) => {
        const updatedTodos = [];
        for (todo of todos) {
            updatedTodo = DB.find((t) => {
                return t.unique_hash == todo.unique_hash;
            })
            updatedTodo.complete()

            updatedTodos.push(updatedTodo);
        }
        updateTodos(updatedTodos)
    });

    client.on('dc', () => {
        server.close();
    });
});

console.log('Waiting for clients to connect');
server.listen(3003);

const app = express();

app.use(express.static('public'));
app.use('/angularCookies', express.static(path.join(__dirname, 'node_modules/angular-cookies')));

app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Production Express server running at localhost:${PORT}`);
});
