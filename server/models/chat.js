const mongoose = require('mongoose');
const validator = require('validator');

var ChatSchema = new mongoose.Schema({
    name: {
        type: String,
        require: true,
        minlength: 1,
        maxlength: 25,
        trim: true,
    },
    adminsId: {
        type: String,
        require: true
    },
    created: {type: Date, default: Date.now},
    membersIds: [
        {
            id: String
        }
    ]
});

ChatSchema.methods.removeUser = function (userId) {
    var chat = this;
  
    return chat.update({
      $pull: {
        membersIds: {userId}
      }
    });
};

var Chat = mongoose.model('Chat', ChatSchema);

module.exports = {Chat}