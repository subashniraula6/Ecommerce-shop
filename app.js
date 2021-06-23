const express = require('express')
const path = require('path')
const mongoose = require('mongoose')
const errorController = require('./controllers/error')
const bodyParser = require('body-parser')

const shop_router = require('./routes/shop')
const admin_router = require('./routes/admin')
const auth_router = require('./routes/auth')

const User = require('./models/user')
const session = require('express-session')
const MongoDBStore = require('connect-mongodb-session')(session)
const flash = require('connect-flash')
const csrf = require('csurf')
const multer = require('multer')

const app = express();
const MONGODB_URI = 'mongodb+srv://subash123:subash123@cluster0.hzeps.mongodb.net/shop'
const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images'); // this folder should be created already
    },
    filename: (req, file, cb) => {
        cb(null, new Date().toISOString().replace(/:/g, '-') + file.originalname);
    }
})
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/png' ||
        file.mimetype === 'image/jpg' ||
        file.mimetype === 'image/jpeg') {
        cb(null, true)
    } else {
        cb(null, false)
    }
}
const store = new MongoDBStore({
    uri: MONGODB_URI,
    collection: 'sessions'
})

const csrfProtection = csrf(); // default configuration

app.set('view engine', 'ejs')
app.set('views', 'views')

// parsing request body It is always first middelware than validation
// The problem with this type of middleware is that error thrown by this
// middleware will directly jump to error middleware where 'session' and 'csrftoken'
// value will not be set that is required for rendering error page '500 page'
// this took me long time.....
app.use(bodyParser.urlencoded({ extended: false }));
app.use(multer({
    storage: fileStorage,
    fileFilter: fileFilter
}).single('image'))


app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));

app.use(
    session({
        secret: 'this is secret signing hash key for saving session id for particular user in cookies',
        resave: false,
        saveUninitialized: false,
        store: store
    })
)
//after session it uses session
app.use(csrfProtection)
// after session as it also uses session
app.use(flash())

//Moved here because
app.use((req, res, next) => {
    res.locals.isAuthenticated = req.session.isLoggedIn;
    res.locals.csrfToken = req.csrfToken();
    next();
})

// Make User equipped with magic methods
app.use((req, res, next) => {
    if (!req.session.user) {
        return next();
    }
    User.findById(req.session.user._id)
        .then(user => {
            // throw new Error('Dummy')
            if (!user) {
                return next();
            }
            req.user = user;
            next();
        })
        .catch(err => {
            next(new Error(err))
        });
});


app.use('/admin', admin_router);
app.use(shop_router);
app.use(auth_router);

// app.get('/500', errorController.get500);

app.use(errorController.get404);

app.use((error, req, res, next) => {
    // res.redirect('/500')
    console.log(error)
    res.status(500).render('error/500', {
        pageTitle: 'Error!',
        url: '/500',
        isAuthenticated: req.session.isLoggedIn
    })
})

mongoose
    .connect(MONGODB_URI)
    .then(db => {
        app.listen(3000)
    })
    .catch(error => console.log('Database connect Error!!!'))

