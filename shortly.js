var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');

var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');
var cookieParser = require('cookie-parser');
var session = require('express-session');

var app = express();

app.configure(function() {
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(partials());
  app.use(express.bodyParser())
  app.use(express.static(__dirname + '/public'));
  app.use(cookieParser());
  app.use(session({secret: 'keyboard cat'}));
});

app.get('/', function(req, res) {
  res.render('index');
});

app.get('/create', function(req, res) {
  res.render('index');
});

app.get('/links', function(req, res) {
  Links.reset().fetch().then(function(links) {
    res.send(200, links.models);
  });
});

app.post('/links', function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.send(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.send(200, found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.send(404);
        }

        var link = new Link({
          url: uri,
          title: title,
          base_url: req.headers.origin
        });

        link.save().then(function(newLink) {
          Links.add(newLink);
          res.send(200, newLink);
        });
      });
    }
  });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/
app.get('/signup', function(req, res) {
  res.render('signup');
});

app.get('/login', function(req, res) {
  res.render('login');
});



app.post('/signup', function(req, res) {
  // look at the user name and password provided -figure out how this is sent , check the req body
  // check against the db that the username doesn't already exist - *EC* check with every letter if it exists
  // if it doesn't, then we add it to the database *EC* send user to confirmation page
  // password - hash the password, using bcrypt, which handles the salting!
  // redirect to the index
  // console.log(req.body);


  new User({username:req.body.username}).fetch().then(function(found){
    if (found) {
      console.log('this username already exists');
      res.end();
    } else {
      var newUser = new User({
        username: req.body.username,
        password: req.body.password
      });

      newUser.save().then(function(newUser) {
        console.log("Saved!", newUser);
        // start a session and basically have a token for the user and redirect to the index
        res.end();
      });
    }
  });
});

app.post('/login', function(req, res) {
  // session creation

  // check the username and password against the db
  new User ({
    username: req.body.username,
    password: req.body.password
  }).fetch().then(function(found) {
    if (found) {
      //start session
      //send cookie
      req.session.regenerate(function(){
        req.session.user = req.body.username;
        res.redirect('/');
      });
    } else {
      console.log("bad username/pass combo");
      //handle invalid username + password
      res.end();
    }
  });


  // hashed password! bcrypt salting
  // if it checks out, start a session, add the token to the sessions table and make sure we set the expiration date
  // and THEN redirect to the index
});




/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        link_id: link.get('id')
      });

      click.save().then(function() {
        db.knex('urls')
          .where('code', '=', link.get('code'))
          .update({
            visits: link.get('visits') + 1,
          }).then(function() {
            return res.redirect(link.get('url'));
          });
      });
    }
  });
});

console.log('Shortly is listening on 4568');
app.listen(4568);
