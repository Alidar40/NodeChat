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


var Chat = mongoose.model('Chat', ChatSchema);

module.exports = {Chat}