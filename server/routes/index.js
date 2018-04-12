//require('./config/config')
const _ = require('lodash');
const bodyParser = require('body-parser');

var User = require('./../models/user').User;
var HttpError = require('./../error/error').HttpError;
var ObjectID = require('mongodb').ObjectID;
/*
var app = express();
app.use(bodyParser.json());

//POST/users
app.post('/users', (req, res) => {
  var body = _.pick(req.body, ['email', 'password']);
  var user = new User(body);

  user.save().then(() => {
    return user.generateAuthToken();
    }).then((token) => {
      res.header('x-auth', token).send(user);
    }).catch((e) => {
      res.status(400).send(e);
    })
});

app.post('/users/login', (req, res) => {
  var body = _.pick(req.body, ['email', 'password']);

  User.findByCredentials(body.email, body.password).then((user) => {
    return user.generateAuthToken().then((token) => {
      res.header('x-auth', token).send(user);
    });
  }).catch((e) =>{
    res.status(400).send();
  });
});

app.delete('/users/me/token', authenticate, (req, res) => {
  req.user.removeToken(req.token).then(() => {
    res.status(200).send();
  }), () => {
    res.status(400).send();
  }
});

app.get('/users', function(req, res, next) {
  User.find({}, function(err, users) {
    if (err) return next(err);
    res.json(users);
  })
});

app.get('/users/me', authenticate, (req, res) => {
  res.send(req.user);
});

app.get('/user/:id', function(req, res, next) {
  try {
    var id = new ObjectID(req.params.id);
  } catch (e) {
    next(404);
    return;
  }

  User.findById(id, function(err, user) { // ObjectID
    if (err) return next(err);
    if (!user) {
      return next(404);
    }
    res.json(user);
  });
});

module.exports = {app};
*/
