const express = require('express')
const router = express.Router()
const authController = require('../controllers/auth')
const { check, body } = require('express-validator/check')
const User = require('../models/user')

router.get('/login', authController.getLogin)

router.post('/login',
    [
        check('email')
            .not()
            .isEmpty()
            .normalizeEmail() // Sanitization (converting capitals)
            .withMessage('Please Enter Email')
            .isEmail()
            .withMessage('Please Enter correct email')
        ,
        body('password', 'Password has to be valid.')
            .isLength({ min: 5 })
            .isAlphanumeric()
            .trim() // Sanitization (Ignoring spaces)
    ],
    authController.postLogin)

router.post('/logout', authController.postLogout)

router.get('/signup', authController.getSignup)

router.post('/signup',
    [check('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please enter a valid email')
        // To define custom validation rule
        // .custom((value, { req }) => {
        //     if (value === 'test@test.com')
        //         throw new Error('This email address is forbidden') // Or return false
        //     return true; //if validation succeded
        // })
        .custom((value, { req }) => {
            return User.findOne({ email: value })
                .then(user => {
                    if (user) {
                        return Promise.reject('Email already taken. Pick a different one')
                    }
                    return true
                })
        })
        ,
    body('password', 'Password must contain alphabets and numbers of atleast 6 characters')
        .isLength({ min: 6 })
        .isAlphanumeric()
        .matches(/\d/) 
        .withMessage('Must contain a number')
        .trim()
        ,
    body('confirmPassword')
        .trim()
        .custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('Password must match')
            }
            return true;
        })
    ],
    authController.postSignup),

    router.get('/reset', authController.getReset),

    router.post('/reset', authController.postReset)

router.get('/reset/:resetId', authController.getNewPassword)

router.post('/new-password', authController.postNewPassword)

module.exports = router;