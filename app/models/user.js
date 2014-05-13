var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');
// var Session = require('./session'); // MUST MAKE THIS LATER?

var User = db.Model.extend({
  tableName: 'users',
  // sessions: function() {
  //   return this.hasMany(Session); // THINK MORE ABOUT THIS LATER
  // },

  initialize: function(userObj) {
    console.log('USer created!');

    bcrypt.hash(userObj.password, null, null, function(err, hash){
      if (err) {
        console.log(err);
        throw err;
      } else {
        console.log("Hash", hash);
        this.username = userObj.username;
        this.password = hash;
      }
    });
  }
});

// when we initialize , we get the username, and the password
// this is when we hash the password and store it in the db?

module.exports = User;
