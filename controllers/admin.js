const { validationResult } = require('express-validator');
const { ObjectId } = require('mongodb');
const Product = require('../models/products')
const fs = require('fs')
const fileHelper = require('../utils/fileHelper')

const getAddproduct = (req, res, next) => {
    const editMode = req.query.edit; // false
    res.render('admin/edit-product', {
        pageTitle: 'Add product',
        url: '/admin/add-product',
        editing: editMode,
        hasError: false,
        errorMessage: null,
        validateErrors: []
    })
}

const postAddProduct = (req, res, next) => {
    const {
        title,
        price,
        description,
    } = req.body;

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(422)
            .render('admin/edit-product', {
                pageTitle: 'Add product',
                url: '/admin/add-product',
                editing: false,
                hasError: true,
                errorMessage: errors.array()[0].msg,
                product: {
                    title: req.body.title,
                    price: req.body.price,
                    description: req.body.description,
                },
                validateErrors: errors.array()
            })
    }
    const image = req.file;

    if (!image) {
        return res.status(422)
            .render('admin/edit-product', {
                pageTitle: 'Add product',
                url: '/admin/add-product',
                editing: false,
                hasError: true,
                errorMessage: 'Attached file is not an image',
                product: {
                    title: req.body.title,
                    price: req.body.price,
                    description: req.body.description,
                },
                validateErrors: []
            })
    }
    const imageUrl = image.path;
    // mapping
    const product = new Product({
        title: title,
        imageUrl: imageUrl,
        price: price,
        description: description,
        userId: req.user,
        //_id: new ObjectId('60c6f317a5fcff113841b9a9')
    })

    // mongoose save method
    // remember this 'then' and 'catch' are 
    // mongoose methods not due to promise..
    product
        .save()
        .then(product => {
            res.redirect('/admin/products')
        })
        .catch(err => {
            // 1.displaying error in flash errormessages
            // const error = new Error(err)
            // error.httpStatusCode = 500;
            // return next(error)
            // return res.status(500)
            //     .render('admin/edit-product', {
            //         pageTitle: 'Add product',
            //         url: '/admin/add-product',
            //         editing: false,
            //         hasError: true,
            //         product: {
            //             title: req.body.title,
            //             imageUrl: req.body.imageUrl,
            //             price: req.body.price,
            //             description: req.body.description,
            //         },
            //         validateErrors: [],
            //         errorMessage: 'Database operation failed. Sorry for the incovenience'
            //     })

            // 2.If error is large and have to be shown in different error page
            const error = new Error(err)
            error.httpStatusCode = 500;
            return next(error) // Directly jump into error handing middleware in app.js other middleware will be skipped
        })
}

const getProducts = (req, res, next) => {
    // Product.find()
    Product.find({ userId: req.user._id })
        //.select('title price -_id') //exclude _id
        .populate('userId', 'email')
        .then(products => {
            res.render('admin/products', {
                prods: products,
                pageTitle: "Admin products",
                url: '/admin/products'
            });
        })
        .catch(error => console.log(error))
}

const getEditProduct = (req, res, next) => {
    //get editMode value from url
    const editMode = req.query.edit;
    if (!editMode) {
        res.redirect('/')
    }
    const prodId = req.params.productId;
    Product.findOne({ _id: prodId, userId: req.user._id })//Authorization
        // Product.findOne({ _id: prodId }) 
        .then(product => {
            if (!product) {
                return res.redirect('/')
            }
            res.render('admin/edit-product', {
                product: product,
                pageTitle: "Edit product",
                url: '/edit-product',
                hasError: false,
                editing: editMode,
                errorMessage: undefined,
                validateErrors: []
            });
        })
        .catch(err => {
            const error = new Error(err)
            error.httpStatusCode = 500;
            return next(error)
        })
}

const postEditProduct = (req, res, next) => {

    const prodId = req.body.id;
    const updated_title = req.body.title;
    const updated_image = req.file;
    const updated_price = req.body.price;
    const updated_description = req.body.description;

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(422)
            .render('admin/edit-product', {
                product: {
                    title: updated_title,
                    price: updated_price,
                    description: updated_description,
                    _id: prodId
                },
                pageTitle: "Edit product",
                url: '/edit-product',
                hasError: true,
                editing: true,
                errorMessage: errors.array()[0].msg,
                validateErrors: errors.array()
            });
    }
    // Product.findById(id)
    Product.findOne({ _id: prodId, userId: req.user._id })//Authorization
        .then(product => {
            if (product) {
                product.title = updated_title;
                if (updated_image) {
                    fileHelper.deleteImage(product.imageUrl);
                    product.imageUrl = updated_image.path;
                }
                product.price = updated_price;
                product.description = updated_description;
                return product.save()
            }
        })
        .then(product => {
            res.redirect('/admin/products');
        })
        .catch(err => {
            const error = new Error(err)
            error.httpStatusCode = 500;
            return next(error)
        })
}

const deleteProduct = (req, res, next) => {
    // Product.findByIdAndRemove(req.body.id)
    const productId = req.params.productId;
    Product.findById(productId)
        .then(product => {
            if (!product) {
                return next(new Error('No products found!'))
            }
            fileHelper.deleteImage(product.imageUrl)
            return Product.deleteOne({ _id: productId, userId: req.user._id })
        })
        .then(result => {
            // Remove product from cart
            return req.user.deleteCartItem(productId)
        })
        .then(result => {
            res.status(200).json({ message: "success!" })
        })
        .catch(err => {
            res.status(500).json({ message: "deleting product failed" })
        })
}
module.exports = {
    getAddproduct,
    postAddProduct,
    getProducts,
    getEditProduct,
    postEditProduct,
    deleteProduct
}