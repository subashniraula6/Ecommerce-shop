const Product = require('../models/products')
const Order = require('../models/order');
const fs = require('fs')
const path = require('path');
const PdfDocument = require('pdfkit');
const { ObjectID } = require('mongodb');
const stripe = require('stripe')('sk_test_51HI9ZAIWnLKPmap4NTBdYRzTWHswBfTJYKH7SH31eYdU2F8GMsqgyyUqLxTn2cApnhVXpuac9xQ8bH7mDUlbPj3w00qW8YIiyf')

const PRODUCTS_PER_PAGE = 2;

const getIndex = (req, res, next) => {
    const page = req.query.page || 1;
    Product.find()
        .count()
        .then(totalProducts => {
            Product.find()
                .skip((page - 1) * PRODUCTS_PER_PAGE)
                .limit(PRODUCTS_PER_PAGE)
                .then(products => {
                    res.render('shop/index', {
                        prods: products,
                        pageTitle: "Shop",
                        url: '/shop',
                        currentPage: page,
                        hasNextPage: page * PRODUCTS_PER_PAGE < totalProducts,
                        hasPrevPage: page > 1,
                        lastPage: Math.ceil(totalProducts / PRODUCTS_PER_PAGE),
                        hasFirstPage: (+page - 1) === 1 ||
                            +page === 1,
                        hasLastPage: +page === Math.ceil(totalProducts / PRODUCTS_PER_PAGE) ||
                            (+page + 1) === Math.ceil(totalProducts / PRODUCTS_PER_PAGE)
                    });
                })
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error)
        })
}

const getAllProducts = (req, res, next) => {
    const page = req.query.page || 1;
    Product.find()
        .count()
        .then(totalProducts => {
            Product.find()
                .skip((page - 1) * PRODUCTS_PER_PAGE)
                .limit(PRODUCTS_PER_PAGE)
                .then(products => {
                    res.render('shop/index', {
                        prods: products,
                        pageTitle: "All products",
                        url: '/products',
                        currentPage: page,
                        hasNextPage: page * PRODUCTS_PER_PAGE < totalProducts,
                        hasPrevPage: page > 1,
                        lastPage: Math.ceil(totalProducts / PRODUCTS_PER_PAGE),
                        hasFirstPage: (+page - 1) === 1 ||
                            +page === 1,
                        hasLastPage: +page === Math.ceil(totalProducts / PRODUCTS_PER_PAGE) ||
                            (+page + 1) === Math.ceil(totalProducts / PRODUCTS_PER_PAGE)
                    });
                })
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error)
        })
}

const getProduct = (req, res, next) => {
    // const id = new ObjectId(req.params.productId);
    // const id = req.params.productId;
    // mongoose method
    Product.findById(id)
        .then(product => {
            res.render('shop/product-details', {
                pageTitle: 'Product Details',
                product: product,
                url: '/products'
            })
        })
        .catch(error => console.log(error))
}

const getCart = (req, res, next) => {
    req.user
        .populate('cart.items.productId')
        .execPopulate() // this returns promise
        .then(user => {
            const products = user.cart.items
            res.render('shop/cart', {
                pageTitle: 'Your cart',
                url: 'shop/cart',
                products: products
            })
        })
        .catch(error => console.log(error))
}

const postCart = (req, res, next) => {
    const prodId = req.body.productId;
    Product.findById(prodId)
        .then(product => {
            return req.user.addToCart(product)
        })
        .then(result => res.redirect('/cart'))
        .catch(error => console.log(error))
}


const postDeleteCartItem = (req, res, next) => {
    const prodId = req.body.id;
    req.user
        .deleteCartItem(prodId)
        .then(result => res.redirect('/cart'))
        .catch(error => console.log(error))
}

const getCheckout = (req, res, next) => {
    let products;
    let total = 0;
    req.user
        .populate('cart.items.productId')
        .execPopulate() // this returns promise
        .then(user => {
            products = user.cart.items;
            products.forEach(product => {
                total += product.productId.price * product.quantity;
            })
            return stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: products.map(p => {
                    return {
                        name: p.productId.title,
                        description: p.productId.description,
                        amount: p.productId.price * 100,
                        currency: 'usd',
                        quantity: p.quantity,
                    }
                }),
                mode: 'payment',
                success_url: `${req.protocol}://${req.get('host')}/checkout/success`,
                cancel_url: `${req.protocol}://${req.get('host')}/checkout/cancel`,
            })
        })
        .then(session => {
            res.render('shop/checkout', {
                pageTitle: 'Checkout',
                url: '/checkout',
                products: products,
                totalSum: total,
                sessionId: session.id
            })
        })
        .catch(error => console.log(error))
}

const getCheckoutSuccess = (req, res, next) => {
    req.user
        .populate('cart.items.productId')
        .execPopulate()
        .then(user => {
            const products = user.cart.items.map(item => {
                return {
                    quantity: item.quantity,
                    product: { ...item.productId._doc }
                }
            })
            const order = new Order({
                products: products,
                user: {
                    email: user.email,
                    userId: user
                }
            })
            return order.save()
        })
        .then(order => {
            // Clear Cart
            req.user.cart.items = [];
            req.user.save()
        })
        .then(result => {
            res.redirect('/orders')
        })
        .catch(error => console.log(error))
}

const postOrders = (req, res, next) => {
    req.user
        .populate('cart.items.productId')
        .execPopulate()
        .then(user => {
            const products = user.cart.items.map(item => {
                return {
                    quantity: item.quantity,
                    product: { ...item.productId._doc }
                }
            })
            const order = new Order({
                products: products,
                user: {
                    email: user.email,
                    userId: user
                }
            })
            return order.save()
        })
        .then(order => {
            // Clear Cart
            req.user.cart.items = [];
            req.user.save()
        })
        .then(result => {
            res.redirect('/orders')
        })
        .catch(error => console.log(error))
}

const getOrders = (req, res, next) => {
    Order.find({ 'user.userId': req.user._id })
        .populate('products.productId')
        .then(orders => {
            // Check if product exists
            res.render('shop/orders', {
                orders: orders,
                pageTitle: 'Your Orders',
                url: '/orders'
            })
        })
        .catch(error => console.log(error))
}

const getOrder = (req, res, next) => {
    // const orderId = new ObjectID(req.params.orderId);
    const orderId = ObjectID(req.params.orderId);
    const invoiceName = 'invoice' + '-' + orderId + '.pdf';
    const invoicePath = path.join(process.mainModule.path, 'data', invoiceName);
    Order.findById(orderId)
        .then(order => {
            if (!order) {
                return next(new Error('Sorry the order is not found!'))
            }
            if (order.user.userId.toString() !== req.user._id.toString()) {
                return next(new Error('Unauthorized!'))
            }
            // fs.readFile(invoicePath, (err, data) => {
            //     if (err) {
            //         return next(err)
            //     }
            //     res.setHeader('Content-Type', 'application/pdf')
            //     res.setHeader('Content-Disposition', `attachment; filename = ${invoiceName}`)
            //     res.send(data)
            // })

            // const file = fs.createReadStream(invoicePath);
            // res.setHeader('Content-Type', 'application/pdf')
            // res.setHeader('Content-Disposition', `inline; filename = ${invoiceName}`)
            // file.pipe(res); // Pipe readable stream to writeable stream(res object) remember not every object is writable stream

            const pdfDoc = new PdfDocument(); //pdfDoc is a radable stream
            pdfDoc.pipe(fs.createWriteStream(invoicePath)); // to store in server
            pdfDoc.pipe(res);  // to server user

            res.setHeader('Content-Type', 'application/pdf')
            res.setHeader('Content-Disposition', `inline; filename = ${invoiceName}`)
            pdfDoc.fontSize(26).text('Invoice', {
                underline: true,
                align: 'center',
                lineGap: 20
            });
            pdfDoc.text('------------------------------------------------------')
            let totalPrice = 0;
            order.products.forEach(product => {
                totalPrice += product.product.price * product.quantity;
                pdfDoc.text(product.product.title +
                    ' - ' + product.quantity +
                    ' * $' + product.product.price +
                    ' = $' +
                    product.quantity * product.product.price)
            })
            pdfDoc.text('----------')
            pdfDoc.fontSize(25).text('Total = $' + totalPrice)
            pdfDoc.end();

        })
        .catch(error => console.log(error))
}

const increaseQuantity = (req, res, next) => {
    const prodId = req.body.id;
    req.user.increaseQuantity(prodId)
        .then(user => {
            res.redirect('/cart')
        })
        .catch(error => console.log(error))
}

const decreaseQuantity = (req, res, next) => {
    const prodId = req.body.id;
    req.user.decreaseQuantity(prodId)
        .then(user => {
            res.redirect('/cart')
        })
        .catch(error => console.log(error))
}

module.exports = {
    getIndex,
    getAllProducts,
    getCart,
    getOrders,
    postOrders,
    getProduct,
    postCart,
    postDeleteCartItem,
    increaseQuantity,
    decreaseQuantity,
    getOrder,
    getCheckout,
    getCheckoutSuccess
}