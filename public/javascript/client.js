// initialize angular app with cookies dependency
const listApp = angular.module('listApp', ['ngCookies']);

// wrapper to access socket IO library in controller
listApp.factory('server', ($rootScope) => {
  const server = io('http://localhost:3003/');
  return {
    on(eventName, callback) {
      server.on(eventName, function () {
        const args = arguments;
        $rootScope.$apply(() => {
          callback.apply(server, args);
        });
      });
    },
    emit(eventName, data, callback) {
      server.emit(eventName, data, function () {
        const args = arguments;
        $rootScope.$apply(() => {
          if (callback) {
            callback.apply(server, args);
          }
        });
      });
    },
  };
});

// main list controller
listApp.controller('ListController', [
  '$scope', 'server', '$cookies',
  ($scope, server, $cookies) => {
    $scope.disableMakeButton = true;
    // disable all buttons when d/c from socket
    $scope.disableAll = false;
    $scope.todoList = [];

    // store todo list into cache
    const storeCache = () => {
      $cookies.put('listData', JSON.stringify($scope.todoList));
    };

    // handle for initial load event
    server.on('load', (todos) => {
      $scope.todoList = todos;
      storeCache();
    });

    // handler for new todo event
    server.on('new', (todo) => {
      $scope.todoList.push(todo);
      storeCache();
    });

    // handler for update todo event
    server.on('update', (todos) => {
      for (const todo of todos) {
        const todoIndex = $scope.todoList.findIndex(t => t.unique_hash === todo.unique_hash);
        $scope.todoList[todoIndex] = todo;
      }
      storeCache();
    });

    // handler for delete todo event
    server.on('delete', (todos) => {
      for (const todo of todos) {
        const todoIndex = $scope.todoList.findIndex(t => t.unique_hash === todo.unique_hash);
        $scope.todoList.splice(todoIndex, 1);
      }
      storeCache();
    });

    // handler when unable to connect to server
    // load todos from cache and disable all buttons
    server.on('connect_error', () => {
      $scope.todoList = JSON.parse($cookies.get('listData'));
      $scope.disableAll = true;
    });

    // same handler as above but for server disconnect
    server.on('disconnect', () => {
      $scope.todoList = JSON.parse($cookies.get('listData'));
      $scope.disableAll = true;
    });

    // handler to request server to make a new todo
    $scope.add = (listTitle) => {
      server.emit('make', {
        title: listTitle,
      });

      $scope.newEntry = '';
      $scope.disableMakeButton = true;
    };

    // handler to disable make button when input is empty
    $scope.handleInputChange = () => {
      if ($scope.newEntry) {
        $scope.disableMakeButton = false;
      } else {
        $scope.disableMakeButton = true;
      }
    };

    // handler to send completion toggle request to server
    $scope.handleCompleteToggle = (todo) => {
      server.emit('toggle', todo);
    };

    // helper method to get text for completion button depending on completion status
    $scope.getCompletionText = isComplete => (isComplete ? 'Complete' : 'Incomplete');

    // handler to send delete task event to server
    $scope.handleDelete = (todo) => {
      server.emit('delete', [todo]);
    };

    // handler to send complete all tasks event to server
    $scope.handleCompleteAll = () => {
      server.emit('completeAll', $scope.todoList);
    };

    // handler to send delete all tasks event to server
    $scope.handleDeleteAll = () => {
      server.emit('delete', $scope.todoList);
    };

    // debug handler to kill socket connection and test caching
    $scope.debugCloseSocket = () => {
      server.emit('dc');
    };
  }]);
