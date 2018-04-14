require('./config/config');

const _ = require('lodash');
const path = require('path');
const express = require('express')
const http = require('http')
const socketIO = require('socket.io')
const log = require('./lib/log')(module);
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const {ObjectID} = require('mongodb');
const hbs = require('hbs');

var HttpError = require('./error/error').HttpError;
//var User = require('./models/user');
//var Chat = require('./models/chat');
//var Messages = require('./models/messages');
var {mongoose} = require('./db/mongoose');
var {User} = require('./models/user');
var {Chat} = require('./models/chat');
var {Messages} = require('./models/messages')
var {authenticate} = require('./middleware/authenticate');

const publicPath = path.join(__dirname, '../public');
var app = express();
var server = http.createServer(app);
var io = socketIO(server, { wsEngine: 'ws' });
const port = process.env.PORT;


app.use(require('./middleware/sendHttpError'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../public')));
app.set('views', path.join(__dirname, '../public'));
app.set('view engine', 'hbs');
/*app.use(session({
  store: sessionStore, 
  secret: config.session.secret, 
  cookie: {expires: new Date(253402300000000)}  // Approximately Friday, 31 Dec 9999 23:59:59 GMT
}))  */


//-----------CONTROLERS-------------------
app.get('/', (req, res) => {
  res.render("index.hbs");
});


app.get('/register', (req, res) => {
  res.render("registration.hbs");
});

app.post('/register', (req, res) => {
  var body = _.pick(req.body, ['name', 'email', 'password']);
  var user = new User(body);
  
  user.save().then(() => {
    return user.generateAuthToken().then((token) => {
      res.setHeader('x-auth', token);
      return res.status(201).json(user);
    });
    }).catch((e) => {
      console.log(e);
      return res.status(400).send(e);
    })
    res.redirect('/users');
});

app.get('/login', (req, res) => {
  res.render("login.hbs");
});

app.post('/login', (req, res) => {
  var body = _.pick(req.body, ['email', 'password']);
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  //res.json(body);
  User.findByCredentials(body.email, body.password).then((user) => {
    return user.generateAuthToken().then((token) => {
      //return res.header('x-auth', token).send(user);
      //res.setHeader('x-auth', token);//.send(user);
      res.clearCookie('x-auth');
      res.cookie('x-auth', token, {expires: new Date(253402300000000)});
      //res.send(user);
      return res.redirect('/chats');
    });
  }).catch((e) => {
    console.log(e);
    res.status(400).send(e);
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

//CHAT
app.get('/api/chats', authenticate, (req, res, next) => {  
  var chats = [];
  var index;
  number_processed = 0;
  total = req.user.chats.length;
  res.setHeader('Content-Type', 'application/json');

  for(index = 0; index < req.user.chats.length; ++index) {
    element = req.user.chats[index];
    try {
      var id = new ObjectID(element.id);
    } catch (e) {
      next(404);
      return;
    }
    //console.log("1");

    Chat.findById(id, function(err, chat, next) {
      if (err) return next(err);
      if (!chat) {
        return next(404);
      }
      
      chats.push(chat.name);
      //res.write(chat.name);
      console.log("write");
      //number_processed = number_processed  + 1;
      number_processed++;
      //console.log(number_processed);
      if(number_processed == req.user.chats.length)
      {
        console.log(chats);
        //res.end();
        res.send(chats)
      }
      //console.log(chat.name);
      //res.send(chats);
      //res.json(chat);
      //console.log("2");
    });
    
  }

  /*req.user.chats.forEach((element) => {
    try {
      var id = new ObjectID(element.id);
    } catch (e) {
      next(404);
      return;
    }
    console.log("1");

    Chat.findById(id, function(err, chat, next) {
      if (err) return next(err);
      if (!chat) {
        return next(404);
      }
      chats.push(chat.name);
      console.log(chat.name);
      res.send(chats);
      //res.json(chat);
      //console.log("2");
    });
  });*/
  //console.log("2");
  //res.json(chats);
});

app.get('/chats', authenticate, (req, res, next) => {  
  return res.render("chats.hbs");
})

app.get('/createChat', authenticate, (req, res) => {
  res.render("createChat.hbs");
})

app.post('/createChat', authenticate, (req, res) => {
  var body = _.pick(req.body, ['name']);
  var newChat = new Chat({
    name: req.body.name,
    adminsId: req.user.id
  });

  newChat.membersIds.push({id: req.user._id});

  newChat.save().then(() => {
    req.user.chats.push({id: newChat._id});
    req.user.save();
    res.status(201).send();
  }).catch((e) => {
    res.status(400).send(e);
  })
});

app.get('/addUser', authenticate, (req, res) => {
  res.render("addUser.hbs");
})

app.post('/addUser', authenticate, (req, res) => {
  var chat = req.chat;
  var user = req.user;
  
  if(!user.chats.find((el) => {
    return el === chat._id;
  })){
    return res.status(404).send();
  }

  var newUser;
  User.findOne({email: req.body.email}).then((user) => {
    if (!user) {
      return res.status(404).send();
    }
    else{
      newUser = user;
    }
  });
  //res.status(200).send();
  
  chat.membersIds.push({id: newUser});
  chat.save().then(() => {
    newUser.chats.push({id: chat._id});
    res.status(201).send();
  }).catch((e) => {
    res.status(400).send(e);
  })
});

//-----------SOCKETS-------------------
app.use(express.static(publicPath));
app.use(function(err, req, res, next) {
    if (typeof err == 'number') { // next(404);
      err = new HttpError(err);
    }
    res.sendHttpError(err);
    /* if (err instanceof HttpError) {
      res.sendHttpError(err);
    } else {
      if (app.get('env') == 'development') {
        express.errorHandler()(err, req, res, next);
      } else {
        log.error(err);
        err = new HttpError(500);
        res.sendHttpError(err);
      }
    } */
  });


  io.on('connection', (socket) => {
    log.info('user connected');

    socket.on('send message', (msg) => {
        msg = msg.trim();
        log.info('new message: ' + msg);
        var newMsg = new Messages({message: msg});
        newMsg.save();
        io.emit('send message', msg);
    });
    
    socket.on('disconnect', () => {
        log.info('user disconnected');
    });

    
});

server.listen(port, () => {
    log.info('Server is up on port ' + port)
})

module.exports = {app};