var listApp = angular.module('listApp', ['ngCookies']);

listApp.factory('server', function ($rootScope) {
    var server = io('http://localhost:3003/');
    return {
        on: function (eventName, callback) {
            server.on(eventName, function () {
                var args = arguments;
                $rootScope.$apply(function () {
                    callback.apply(server, args);
                });
            });
        },
        emit: function (eventName, data, callback) {
            server.emit(eventName, data, function () {
                var args = arguments;
                $rootScope.$apply(function () {
                    if (callback) {
                        callback.apply(server, args);
                    }
                });
            })
        }
    };
});

listApp.factory('listCache', function($cacheFactory) {
    return $cacheFactory('listData');
});

listApp.controller('ListController', [
                   '$scope', 'server', '$cookies',
                   function($scope, server, $cookies) {
    $scope.disableMakeButton = true;
    $scope.disableAll = false;
    $scope.todoList = [];

    storeCache = () => {
        $cookies.put('listData', JSON.stringify($scope.todoList));
    }

    server.on('load', (todos) => {
        $scope.todoList = todos;
        storeCache()
    });

    server.on('new', (todo) => {
        console.log(todo);
        $scope.todoList.push(todo);
        storeCache()
    });

    server.on('update', (todos) => {
        for (const todo of todos) {
            const todoIndex = $scope.todoList.findIndex((t) => {
                return t.unique_hash == todo.unique_hash;
            });
            $scope.todoList[todoIndex] = todo;
        }
        storeCache()
    });

    server.on('delete', (todos) => {
        for (const todo in todos) {
            const todoIndex = $scope.todoList.findIndex((t) => {
                return t.unique_hash == todo.unique_hash;
            });
            $scope.todoList.splice(todoIndex, 1);
        }
        storeCache()
    });

    server.on('connect_error', () => {
        $scope.todoList = JSON.parse($cookies.get('listData'));
        $scope.disableAll = true;
    })

    server.on('disconnect', () => {
        $scope.todoList = JSON.parse($cookies.get('listData'));
        $scope.disableAll = true;
    })

    $scope.add = (listTitle) => {
        server.emit('make', {
            title: listTitle,
        });

        $scope.newEntry = "";
        $scope.disableMakeButton = true;
    }

    $scope.handleInputChange = () => {
        if ($scope.newEntry) {
            $scope.disableMakeButton = false;
        }
        else {
            $scope.disableMakeButton = true;
        }
    }

    $scope.handleCompleteToggle = (todo) => {
        server.emit('toggle', todo);
    }

    $scope.getCompletionText = (isComplete) => {
        return isComplete ? "Complete" : "Incomplete";
    }

    $scope.handleDelete = (todo) => {
        server.emit('delete', [todo]);
    }

    $scope.handleCompleteAll = () => {
        server.emit('completeAll', $scope.todoList);
    }

    $scope.handleDeleteAll = () => {
        server.emit('delete', $scope.todoList);
    }

    $scope.debugCloseSocket = () => {
        server.emit('dc');
    }
}]);
