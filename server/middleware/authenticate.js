var {User} = require('./../models/user');

var authenticate = (req, res, next) => {
    //var token = req.header('x-auth');
    var token = req.cookies['x-auth']

    User.findByToken(token).then((user) => {
        if (!user) {
            res.redirect("/login");
            return Promise.reject();
        }

        req.user = user;
        req.token = token;
        next();
    }).catch((e) => {
        res.status(401).send();
    });
};

module.exports = {authenticate};