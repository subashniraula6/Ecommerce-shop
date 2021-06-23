const User = require('../models/user')
const bcrypt = require('bcryptjs')
const nodemailer = require('nodemailer')
const sendgridTransport = require('nodemailer-sendgrid-transport')
const crypto = require('crypto') //To generate Random strings
const user = require('../models/user')
const flash = require('connect-flash/lib/flash')
const { validationResult } = require('express-validator/check')

const transporter = nodemailer.createTransport(
    sendgridTransport({
        auth: {
            api_key: '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'
        }
    })
)

const getLogin = (req, res, next) => {
    let message = req.flash('error')
    if (message.length >= 0) {
        message = message[0]
    } else {
        message = undefined
    }
    res.render('auth/login', {
        pageTitle: 'Login',
        url: '/login',
        errorMessage: message,
        oldInput: {
            email: '',
            password: ''
        },
        validateErrors: []
    })
}

const postLogin = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).render('auth/login', {
            pageTitle: 'Login',
            url: '/login',
            errorMessage: errors.array()[0].msg,
            oldInput: {
                email,
                password
            },
            validateErrors: errors.array()
        })
    }

    User.findOne({ email: email })
        .then(user => {
            if (!user) {
                return res.status(422).render('auth/login', {
                    pageTitle: 'Login',
                    url: '/login',
                    errorMessage: 'Invalid email or password',
                    oldInput: {
                        email,
                        password
                    },
                    validateErrors: errors.array()
                })
            }

            bcrypt.compare(password, user.password)
                .then(doMatch => {
                    if (doMatch) {
                        // save session
                        req.session.isLoggedIn = true;
                        req.session.user = user;
                        // Save is done automatically but it
                        // Done to make sure session is saved in DB (Asynchronous) 
                        // before redirecting
                        return req.session.save((err) => {
                            return res.redirect('/')
                        })
                    }
                    return res.status(422).render('auth/login', {
                        pageTitle: 'Login',
                        url: '/login',
                        errorMessage: 'Invalid email or password',
                        oldInput: {
                            email,
                            password
                        },
                        validateErrors: []
                    })
                })
        })
        .catch(err => {
            const error = new Error(err)
            error.httpStatusCode = 500;
            return next(error)
        })
}

const postLogout = (req, res, next) => {
    req.session.destroy(err => {
        res.redirect('/');
    });
}

const getSignup = (req, res, next) => {
    let message = req.flash('error')
    if (message.length > 0) {
        message = message[0]
    } else {
        message = undefined
    }
    res.render('auth/signup', {
        pageTitle: 'Sign up',
        url: '/signup',
        errorMessage: message,
        oldInput: {
            email: "",
            password: "",
            confirmPassword: ""
        },
        validateErrors: []
    })
}

const postSignup = (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(422).render('auth/signup', {
            pageTitle: 'Sign up',
            url: '/signup',
            errorMessage: errors.array()[0].msg,
            oldInput: {
                email: req.body.email,
                password: req.body.password,
                confirmPassword: req.body.confirmPassword,
            },
            validateErrors: errors.array()
        })
    }
    const email = req.body.email;
    const password = req.body.password;
    // User.findOne({ email: email })
    //     .then(user => {
    //         return bcrypt.hash(password, 12)
    //             .then(hashedPassword => {
    //                 const newUser = new User({
    //                     email: email,
    //                     password: hashedPassword,
    //                     cart: { items: [] }
    //                 })
    //                 return newUser.save()
    //             })
    //             .then(newUser => {
    //                 res.redirect('/login')
    //                 return transporter.sendMail({
    //                     to: email,
    //                     from: 'subashniraula6@gmail.com',
    //                     subject: 'signup succeded',
    //                     html: '<h1>You Successfully signed up!!!</h1>'
    //                 })
    //             })
    //             .then(email => console.log(email))
    //             .catch(error => console.log(error))
    //     })
    //     .catch(error => console.log(error))

    return bcrypt.hash(password, 12)
        .then(hashedPassword => {
            const newUser = new User({
                email: email,
                password: hashedPassword,
                cart: { items: [] }
            })
            return newUser.save()
        })
        .then(newUser => {
            res.redirect('/login')
            return transporter.sendMail({
                to: email,
                from: 'subashniraula6@gmail.com',
                subject: 'signup succeded',
                html: '<h1>You Successfully signed up!!!</h1>'
            })
        })
        .then(email => console.log(email))
        .catch(err => {
            const error = new Error(err)
            error.httpStatusCode = 500;
            return next(error)
        })
}
const getReset = (req, res, next) => {
    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0]
    } else {
        message = undefined
    }
    res.render('auth/reset', {
        pageTitle: 'Reset Password',
        url: '',
        errorMessage: message
    })
}
const postReset = (req, res, next) => {
    crypto.randomBytes(32, (err, buffer) => {
        if (err) {
            return res.redirect('/reset')
        }
        const token = buffer.toString()
        const email = req.body.email;
        User.findOne({ email: email })
            .then(user => {
                if (!user) {
                    req.flash('error', 'Email not registered')
                    return res.redirect('/reset')
                }
                user.resetToken = token
                user.tokenExpiration = Date.now() + 3600000;
                user.save()
                    .then(user => {
                        res.redirect('/')
                        return transporter.sendMail({
                            to: email,
                            from: 'subashniraula6@gmail.com',
                            subject: 'Password reset',
                            html: `
                        <h3>You requested to reset password</h3>
                        <p>
                        Click this 
                            <a href="http://localhost:3000/reset/${token}">
                            link
                            </a>
                        to set new password
                        </p>
                        `
                        })
                    })
                    .then(mailStatus => {
                        console.log(mailStatus)
                    })
                    .catch(err => {
                        const error = new Error(err)
                        error.httpStatusCode = 500;
                        return next(error)
                    })
            })
            .catch(err => {
                const error = new Error(err)
                error.httpStatusCode = 500;
                return next(error)
            })
    })
}
const getNewPassword = (req, res, next) => {
    const token = req.params.resetId;
    User.findOne({
        resetToken: token,
        tokenExpiration: { $gt: Date.now() }
    })
        .then(user => {
            if (!user) {
                req.flash('error', 'invalid link')
                return res.redirect('/')
            }
            let message = req.flash('error');
            if (message.length > 0) {
                message = message[0]
            } else {
                message = undefined
            }
            res.render('auth/newpassword', {
                pageTitle: 'New Password',
                url: '',
                errorMessage: message,
                userId: user._id.toString()
            })
        })
        .catch(err => {
            const error = new Error(err)
            error.httpStatusCode = 500;
            return next(error)
        })
}

const postNewPassword = (req, res, next) => {
    const userId = req.body.userId;
    const password = req.body.password
    User.findOne({ _id: userId })
        .then(user => {
            if (!user) {
                req.flash('error', 'User not found')
                return res.redirect('/login')
            }
            else return bcrypt.hash(password, 12)
                .then(hashedPassword => {
                    user.password = hashedPassword;
                    return user.save()
                })
                .then(user => {
                    res.redirect('/login')
                })
        })
        .catch(err => {
            const error = new Error(err)
            error.httpStatusCode = 500;
            return next(error)
        })
}
module.exports = {
    getLogin,
    postLogin,
    postLogout,
    getSignup,
    postSignup,
    getReset,
    postReset,
    getNewPassword,
    postNewPassword
}