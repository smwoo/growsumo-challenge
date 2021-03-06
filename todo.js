const uuidv4 = require('uuid/v4');

module.exports = class Todo {
  constructor(title = '') {
    this.title = title;
    this.unique_hash = uuidv4();
    this.completed = false;
  }

  complete() {
    this.completed = true;
  }
};
