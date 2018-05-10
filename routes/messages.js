var express = require("express");
var router = express.Router();

router.get('/', function(req, res, next) {
    var client = require('../db/db');

    client.query("SELECT messages.id, profiles.name, profiles.surname, content \n" +
        "FROM messages\n" +
        "INNER JOIN profiles ON profiles.id=sender\n" +
        "WHERE receiver=:user " +
        "ORDER BY id ASC",
        {user: req.user.id},
        function(err, messagesRows) {
            if(err) res.status(500).send('Error. La hemos cagado en algo...');
            var messages = {};
            messagesRows.forEach(function(message) {
                if(!messages[message.name])
                    messages[message.name] = [];
                messages[message.name].push(message);
            });
            res.send(messages);
        });

    client.end();
});

router.post("/send", function(req, res, next){
    var messageData = {
        from: req.body.from,
        to: req.body.to,
        content: req.body.content
    };
    var dbConn = require("../db/db");
    dbConn.query("INSERT INTO messages (sender, receiver, content) VALUES((SELECT profiles.user_id FROM profiles WHERE profiles.email=:from), (SELECT profiles.user_id FROM profiles WHERE profiles.email=:to), :content)",
        {from: messageData.from, to: messageData.to, content: messageData.content},
        function(err, messageSent){
            if(err) {
                console.log(err);
                return res.status(500).send({message: "Ha habido un error en la db: " + err});
            }
            return res.status(200).send();
        });
    dbConn.end();
});

module.exports = router;