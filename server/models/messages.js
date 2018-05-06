const mongoose = require('mongoose');

var MessagesSchema = new mongoose.Schema({
    chatId: String,
    messages: [{
        authorsId: String,
        authorsName: String,
        message: String,
        created: {type: Date, default: Date.now}
    }],
    member: [{
        email: String
    }]
});

var Messages = mongoose.model('Messages', MessagesSchema);

module.exports = {Messages}