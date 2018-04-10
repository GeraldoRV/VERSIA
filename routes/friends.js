var express = require('express');
var router = express.Router();

router.get('/', function (req, res, next) {
    console.log(req.user);
});

router.post('/add', function (req, res, next) {
    var email = req.body.email;

    var client = require('../db/db');
    client.query("INSERT INTO friends(sender, receiver) VALUES(:sender, :receiver)", {sender: req.user.email, receiver: email}, function(err, friendPetition){
        if(err){
            console.log(err);
            return res.status(500).send({message: "Ha habido un error en la db: " + err});
        }
        return res.status(200).send();
    });

    client.end()
});

router.put('/accept',function(req, res, next) {
    var recieverId = req.user.email; // Cambiar por el id o no
    var senderId= req.query.email;

    var client = require('../db/db');
    client.query('UPDATE friends SET friend_request = 1 WHERE sender = :senderId AND reciever = :recieverId',
        {senderId: senderId, recieverId: recieverId},
        function (err, friendPetition) {
            if (err) return res.status(500).send({message: "Ha habido un error en la db: " + err});
            return res.status(200).send();
    });

    client.end();
});

router.put('/decline',function(req, res, next) {
    var recieverId = req.user.email; // Cambiar por el id o no
    var senderId= req.query.email;

    var client = require('../db/db');
    client.query('DELETE FROM friends WHERE sender = :senderId AND reciever = :recieverId',
        {senderId: senderId, recieverId: recieverId},
        function (err, friendPetition) {
            if (err) return res.status(500).send({message: "Ha habido un error en la db: " + err});
            return res.status(200).send();
        });

    client.end();
});

module.exports = router;