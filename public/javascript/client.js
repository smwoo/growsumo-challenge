var listApp = angular.module('listApp', []);

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

listApp.controller('ListController', ['$scope', 'server', function($scope, server) {
    $scope.disableMakeButton = true;
    $scope.todoList = [];
    server.on('load', (todos) => {
        $scope.todoList = todos;
    });

    server.on('new', (todo) => {
        console.log(todo);
        $scope.todoList.push(todo);
    });

    server.on('update', (todo) => {
        const todoIndex = $scope.todoList.findIndex((t) => {
            return t.unique_hash == todo.unique_hash;
        });
        $scope.todoList[todoIndex] = todo;
    });

    server.on('delete', (todo) => {
        console.log(todo);
        const todoIndex = $scope.todoList.findIndex((t) => {
            return t.unique_hash == todo.unique_hash;
        });
        $scope.todoList.splice(todoIndex, 1);
    });

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
        server.emit('delete', todo);
    }
}]);
