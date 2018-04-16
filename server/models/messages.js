const mongoose = require('mongoose');

var MessagesSchema = new mongoose.Schema({
    chatId: String,
    messages: [{
        authorsId: String,
        message: String,
        created: {type: Date, default: Date.now}
    }
    ]
});

var Messages = mongoose.model('Messages', MessagesSchema);

module.exports = {Messages}