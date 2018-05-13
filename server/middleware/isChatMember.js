var {User} = require('./../models/user');

var isChatMember = (req, res, next) => {
    var user = req.user;

    chatId = req.body.chatId;

    if(!user.chats.find((el) => {
        return el.id == chatId;
    })){
        return res.status(403).send("You heve not permissions to invite users in this chat");
    }
};

module.exports = {isChatMember};