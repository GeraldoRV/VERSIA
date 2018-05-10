var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var methodOverride = require('method-override');
var logger = require('morgan');
var passport = require('passport');
var session = require('express-session');
var flash = require('connect-flash');

require('./config/passport')(passport);

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(methodOverride('_method'));

// required for passport
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash());

// Resources
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'node_modules/bootstrap/dist')));
app.use(express.static(path.join(__dirname, 'node_modules/jquery/dist')));
app.use(express.static(path.join(__dirname, 'node_modules/popper.js/dist')));

app.use(function(req, res, next) {
    res.locals.user = req.user;
    next();
});

// Debug
process.argv.forEach(function(value) {
    if(value === "debug") {
        console.log("RUNNING DEBUG MODE");
        app.use(function(req, res, next) {
            res.locals.user = req.user = {id:3, email: "david@ulpgc.es", password: "versia"};
            next();
        });
    }
});

// Routes
app.use('/', require('./routes/index'));
app.use(function isLogged(req, res, next) {
    if(req.isAuthenticated()) return next();
    else res.redirect('/');
});
app.use('/home', require('./routes/home'));
app.use('/home/users/messages', require('./routes/messages'));
app.use('/home/users/friends', require('./routes/friends'));
app.use('/home/users', require('./routes/users'));
app.use('/home/group', require('./routes/group'));
app.use('/home/posts', require('./routes/posts'));


// catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

app.listen(process.env.port || 8080);

module.exports = app;