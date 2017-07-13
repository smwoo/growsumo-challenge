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

    server.on('update', (todo) => {
        $scope.todoList.push(todo);
    });

    $scope.add = (listTitle) => {
        server.emit('make', {
            title: listTitle,
        });

        $scope.newEntry = "";
    }

    $scope.handleInputChange = () => {
        if ($scope.newEntry) {
            $scope.disableMakeButton = false;
        }
        else {
            $scope.disableMakeButton = true;
        }
    }
}]);
