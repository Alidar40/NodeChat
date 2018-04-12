const mongoose = require('mongoose');
const validator = require('validator');

var ChatSchema = new mongoose.Schema({
    name: {
        type: String,
        require: true,
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
/*
ChatSchema.statics.findById = function (id) {
    var Chat = this;
  
    return Chat.findOne({"_id": new ObjectId(id)});
  };*/

var Chat = mongoose.model('Chat', ChatSchema);

module.exports = {Chat}