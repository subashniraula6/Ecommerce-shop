const express = require('express')
const router = express.Router();
const isAuth = require('../middleware/is-auth')
const { body } = require('express-validator')

const admin_controller = require('../controllers/admin');

router.get('/add-product', isAuth, admin_controller.getAddproduct)

router.post('/add-product',
    [
        body('title')
            .not()
            .isEmpty()
            .withMessage('Please enter title')
            .isLength({ min: 3 })
            .withMessage('Enter title of at least 3 characters')
            .isAlphanumeric()
            .withMessage('Characters should contain number and alphabets')
            .trim()
        ,
        body('price')
            .isFloat()
            .not()
            .isEmpty()
            .withMessage('Please enter price')
        ,
        body('description')
            .not()
            .isEmpty()
            .withMessage('Please enter description')
            .isLength({ min: 5, max: 250 })
            .withMessage('Description should contain atleast 5 characters and at most 250 characters')
            .trim()
    ],
    isAuth,
    admin_controller.postAddProduct)

router.get('/products', isAuth, admin_controller.getProducts)

router.get('/edit-product/:productId', isAuth, admin_controller.getEditProduct)

router.post('/edit-product',
    [
        body('title')
            .not()
            .isEmpty()
            .withMessage('Please enter title')
            .isLength({ min: 3 })
            .withMessage('Enter title of at least 3 characters')
            .isAlphanumeric()
            .withMessage('Characters should contain number and alphabets')
            .trim()
        // ,
        // body('image')
        //     .not()
        //     .isEmpty()
        //     .withMessage('Please enter imageUrl')
        ,
        body('price')
            .not()
            .isEmpty()
            .withMessage('Please enter price')
            .isFloat()
        ,
        body('description')
            .not()
            .isEmpty()
            .withMessage('Please enter description')
            .isLength({ min: 5, max: 250 })
            .withMessage('Description should contain atleast 5 characters and at most 250 characters')
            .trim()
    ],
    isAuth,
    admin_controller.postEditProduct)

router.delete('/product/:productId', isAuth, admin_controller.deleteProduct)


module.exports = router;