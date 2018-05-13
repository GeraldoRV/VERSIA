var express = require("express");
var router = express.Router();

router.get('/', function(req, res, next) {
    var client = require('../db/db');

    var profile = {};
    client.query('SELECT * FROM profiles WHERE user_id=:user_id', {user_id: req.params.id}, function(err, profileResult) {
        if(err) res.status(500).send({message: "Ha habido un error en la db: " + err});
        profile = profileResult[0];
    });

    var friends = {};
    client.query("SELECT * FROM profiles WHERE user_id IN " +
        "(SELECT sender FROM friends WHERE receiver=:user AND friend_request=1 UNION ALL SELECT receiver FROM friends WHERE sender=:user AND friend_request=1)",
        {user: req.params.id}, function(err, friendsRows) {
            if(err) console.log(err);
            friends = friendsRows;
        });

    var groups = {};
    client.query("SELECT name FROM groups WHERE id IN " +
        "(SELECT `group`FROM group_members WHERE `member`=:member AND group_request=1)", {member: req.user.id}, function(err, groupsRows) {
        if(err) return res.status(500).send({message: "Ha habido un error en la db" + err});
        else groups = groupsRows;
    });

    client.query("SELECT messages.id, profiles.name, profiles.surname, content \n" +
        "FROM messages \n" +
        "INNER JOIN profiles ON profiles.id=sender \n" +
        "WHERE receiver=3 ORDER BY id DESC",
        {user: req.user.id},
        function(err, messages) {
            if(err) res.status(500).send('Error. La hemos cagado en algo...');
            res.render('user/messages', {profile: profile, friends: friends, groups: groups, messages: messages});
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