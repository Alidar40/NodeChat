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
const cookie = require('cookie');
var async = require('async');

var HttpError = require('./error/error').HttpError;
var {mongoose} = require('./db/mongoose');
var {User} = require('./models/user');
var {Chat} = require('./models/chat');
var {Messages} = require('./models/messages')
var {authenticate} = require('./middleware/authenticate');
var {isChatMember} = require('./middleware/isChatMember');

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

//-----------CONTROLERS-------------------
app.get('/', (req, res) => {
  res.redirect("chats.hbs");
});


app.get('/register', (req, res) => {
  res.render("registration.hbs");
});

app.post('/api/register', (req, res) => {
  var body = _.pick(req.body, ['name', 'email', 'password']);
  var newUser = new User(body);

  User.findOne({email: body.email}).then((user) => {
    if(!user){
      newUser.save().then(() => {
        return newUser.generateAuthToken().then((token) => {
          res.clearCookie('x-auth');
          res.cookie('x-auth', token, {expires: new Date(253402300000000)});
          return res.status(201).json(newUser);
        });
        }).catch((e) => {
          return res.status(400).send(e);
        })
    }
    else{
      res.status(400).send("User with same e-mail is already registered");
    }
  }).catch((e) => {
    res.status(400).send(e);
  });
});

app.get('/login', (req, res) => {
  res.render("login.hbs");
});

app.post('/api/login', (req, res) => {
  var body = _.pick(req.body, ['email', 'password']);
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  
  if(req.cookies['x-auth'] !== undefined)
  {
    res.redirect('/chats');
    res.status(200).send();
  }
  
  User.findByCredentials(body.email, body.password).then((user) => {
    if (!user){
      return res.status(400).send("Invalid email or password");
    }

    return user.generateAuthToken().then((token) => {
      res.clearCookie('x-auth');
      res.cookie('x-auth', token, {expires: new Date(253402300000000)});
      return res.status(200).send();
    });
  }).catch((e) => {
    res.status(400).send("Invalid email or password");
  });
});

app.post('/api/logout', authenticate, (req, res) => {
  req.user.removeToken(req.token).then(() => {
    res.clearCookie('x-auth');
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

  User.findById(id, function(err, user) { 
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

    Chat.findById(id, function(err, chat, next) {
      if (err) return next(err);
      
      if (!chat) {
        return next;
      }

      chats.push(chat);
      number_processed++;
      
      if(number_processed == req.user.chats.length)
      {
        res.send(chats)
      }
    });
  }
});

app.get('/chats', authenticate, (req, res, next) => {  
  return res.render("chats.hbs");
})

app.get('/api/getMessages', authenticate, (req, res) => {
  Messages.findOne({chatId: req.query.chatId}).then(function(messages) {
    if(!messages){
      throw new Error('(from: /api/getMessages) No record found.');
    } 

    res.send(messages.messages);
  });
})

app.get('/api/getChatUsers', authenticate, (req, res) => {
  var chatMembersIds;

  Chat.findOne({_id: new ObjectID(req.query.chatId)}).then(function(chat) {
    if(!chat){
      throw new Error('(from: /api/getChatUsers) No record found.');
    } 

    chatMembersIds = chat.membersIds;
    var users = [];
    var index;
    number_processed = 0;
    total = req.user.chats.length;
    res.setHeader('Content-Type', 'application/json');
    
    for(index = 0; index < chatMembersIds.length; ++index) {
      element = chatMembersIds[index].id;
      try {
        var id = new ObjectID(element);
      } catch (e) {
        next(404);
        return;
      }

      User.findById(id, function(err, user, next) {
        if (err) return next(err);
        
        if (!user) {
          return next;
          //return next(404);
        }

        users.push(user);
        number_processed++;
        
        if(number_processed == chatMembersIds.length)
        {
          res.send(users);
        }
      });
    }
  });
})

app.post('/api/createChat', authenticate, (req, res) => {
  var body = _.pick(req.body, ['name']);
  var newChat = new Chat({
    name: req.body.name,
    adminsId: req.user.id
  });
  newChat.membersIds.push({id: req.user._id});

  newChat.save().then(() => {
    req.user.chats.push({id: newChat._id});
    req.user.save();
    res.status(201).send(newChat._id);
  }).catch((e) => {
    res.status(400).send(e);
  })

  newMsg = new Messages({"chatId": newChat._id, "messages": [{"authorsId": req.user._id, "authorsName": req.user.name, "message": req.user.name + " создал чат"}]});
  newMsg.save();
});

app.post('/api/addUser', authenticate, isChatMember, (req, res) => {
  chatId = req.body.addUserChat;
  newUserEmail = req.body.addUserEmail; 
  var newUser;
  User.findOne({email: newUserEmail}).then((user) => {
    if (!user) {
      return res.status(404).send("user was not found");
    }
    else{
      newUser = user;
      
      if(newUser.chats.find((el) => {
        return el.id == chatId;
      })){
        return res.status(400).send("User is already in this chat");
      }

      Chat.findOne({_id: chatId}).then((_chat) => {
        if (!_chat) {
          throw new Error('(from: /api/addUser) chat was not found.');
          return res.status(404).send();
        }
        else{
          var chat = _chat;
          chat.membersIds.push({id: newUser._id});

          chat.save().then(() => {
            newUser.chats.push({id: chatId});
            newUser.save().then(() => {
              res.status(201).send();
            })
          }).catch((e) => {
            res.status(400).send(e);
          })
        }
      });
    }
  }).catch((e) => {
    res.status(400).send(e);
  });
});

app.post('/api/leaveChat', authenticate, (req, res) => {
  var user = req.user;
  chatId = req.body.chatId;
  async.waterfall([
    function(callback) {
      Chat.findOne({_id: chatId}, callback);
    },
    function(chat, callback) {
      user.leaveChat(chatId).then(() => {
      })
      
      chat.removeUser(user._id).then(() => {
        res.status(201).send();
      })
    },
  ], function(err) {
    log.error(err)
  });

});

//-----------SOCKETS-------------------
app.use(express.static(publicPath));
app.use(function(err, req, res, next) {
    if (typeof err == 'number') { 
      err = new HttpError(err);
    }
    log.error(err)
    res.sendHttpError(err);
  });

  io.on('connection', (socket) => {
    log.info('user connected');
    var cookies = cookie.parse(socket.handshake.headers.cookie, 'x-auth');
    var userId = cookies['x-auth']
    
    //Получение пользователя по его куке
    User.findByToken(userId).then((user) => {
      //Привязка сокета к id пользователя
      socket.join(user.id)
      socket.on('send message', (msg, id) => {
          if (id === ""){
            return;
          }

          msg = msg.trim();
          var newMsg;
          Messages.findOne({chatId: id}).then(function(chat) {
              //Сохранение сообщения в бд
              if(!chat){
                newMsg = new Messages({"chatId": id, "messages": [{"authorsId": user._id, "authorsName": "Сервер", "message": msg}]});
              } 
              else {
                newMsg = chat;
                newMsg.messages.push({"authorsId": user._id, "authorsName": user.name, "message": msg});
              }
              newMsg.save();

              //Отправка сообщения пользователям чата             
              Chat.findById(id, function(err, chat, next) {
                if (err) return next(err);
                
                if (!chat) {
                  return next(404);
                }
               
                for(index = 0; index < chat.membersIds.length; ++index) {
                  io.to(chat.membersIds[index].id).emit('send message', user.name, msg, id);
                }
                
              });
          }).catch((e) => {
              res.status(400).send(e);
          });
        });
    });

    socket.on('disconnect', () => {
        log.info('user disconnected');
    });
});

server.listen(port, () => {
    log.info('Server is up on port ' + port)
})

module.exports = {app};