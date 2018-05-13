var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
    var loggedUserId = req.user.id;

    var client = require('../db/db');
    client.query("SELECT DISTINCT * FROM friends WHERE receiver=:loggedUserId AND friend_request=0", {loggedUserId: loggedUserId}, function(err, friendRequests) {
        if(err) return res.status(500).send({message: "Ha habido un error en la db: " + err});
        res.render("user/profile", {friendRequests: friendRequests});
    });

    client.end();
});


router.get('/search', function(req, res, next) {
    var client = require('../db/db');

    var friendsQuery = "SELECT receiver, friend_request from friends where sender = :loggedUserId AND (friend_request=0 OR friend_request=1)";
    var usersQuery = "SELECT * FROM profiles WHERE profiles.name LIKE :req AND profiles.user_id <> :loggedUserId";
    client.query(friendsQuery, {loggedUserId: req.user.id}, function(err, friends) {
        if(err) res.status(500).send({message: "Error en la petición cuando buscamos amigos, " + err});

        client.query(usersQuery, {req: req.query.search, loggedUserId: req.user.id}, function(err, users) {
            if(err) res.status(500).send({message: "Error en la petición cuando buscamos usuarios, " + err});
            res.render("user/search", {users: users, friends: friends, search: req.query.search});
        });
    });


    client.end();
});

router.get('/:id', function(req, res, next) {
    var client = require('../db/db');

    var profile = {};
    client.query('SELECT * FROM profiles WHERE user_id=:user_id', {user_id: req.params.id}, function(err, profileResult) {
        if(err) res.status(500).send({message: "Ha habido un error en la db: " + err});
        profile = profileResult[0];
    });

    var friendRequests = {};
    // Parte de peticiones de amistad
    client.query("SELECT DISTINCT friends.*, profiles.email, profiles.user_id " +
        "FROM friends " +
        "INNER JOIN profiles ON friends.sender=profiles.user_id " +
        "WHERE friends.receiver=:loggedUserId AND friend_request=0;",
        {loggedUserId: req.user.id}, function(err, friendRequestsRows) {
            if(err) return res.status(500).send({message: "Ha habido un error en la db: " + err});
            friendRequests = friendRequestsRows;
        });


    var posts = {};
    client.query("SELECT DISTINCT posts.user_id, name, content, `date`, profiles.image_profile\n" +
        "FROM posts\n" +
        "INNER JOIN friends ON (posts.user_id=friends.sender OR posts.user_id=friends.receiver)\n" +
        "INNER JOIN profiles ON posts.user_id=profiles.user_id\n" +
        "WHERE friends.friend_request=1 AND (friends.sender=:user OR friends.receiver=:user)\n" +
        "ORDER BY `date` DESC;",
        {user: req.params.id},
        function(err, postsRows) {
            if(err) return res.status(500).send({message: "Ha habido un error en la db: " + err});
            posts = postsRows;
        });

    var friends = {};
    client.query("SELECT * FROM profiles WHERE user_id IN " +
        "(SELECT sender FROM friends WHERE receiver=:user AND friend_request=1 UNION ALL SELECT receiver FROM friends WHERE sender=:user AND friend_request=1)",
        {user: req.params.id}, function(err, friendsRows) {
            if(err) console.log(err);
            friends = friendsRows;
        });

    client.query("SELECT name FROM groups WHERE id IN " +
        "(SELECT `group`FROM group_members WHERE `member`=:member AND group_request=1)", {member: req.user.id}, function(err, groups) {
        if(err) return res.status(500).send({message: "Ha habido un error en la db" + err});
        else res.render("user/profile", {
            profile: profile,
            friends: friends,
            friendRequests: friendRequests,
            groups: groups,
            posts: posts
        });
    });

    client.end();
});

router.post('/:id/edit', function(req, res, next) {
    var client = require("../db/db");
    client.query("UPDATE profiles SET name=:name, surname=:surname where user_id=:loggedUserId",
        {
            name: req.body.name,
            surname: req.body.surname,
            loggedUserId: req.user.id
        },
        function(err, userUpdated) {
            if(err) return res.status(500).send({message: "Ha habido un error en la db: " + err});
            else if(userUpdated) {
                client.query("UPDATE users SET email=:email WHERE id=:loggedUserId", {
                    email: req.body.email,
                    loggedUserId: req.user.id
                }, function(err, updatedEmail) {
                    if(err) return res.status(500).send({message: "Ha habido un error en la db: " + err});
                    return res.status(200).send({status: "success"});
                });
            }
        });
    client.end();
});

module.exports = router;
