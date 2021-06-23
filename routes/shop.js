const express = require('express')
const router = express.Router();
const shop_controller = require('../controllers/shop')

const isAuth = require('../middleware/is-auth')

router.get('/', shop_controller.getIndex)

router.get('/products', shop_controller.getAllProducts)

router.get('/products/:productId', shop_controller.getProduct)

router.post('/cart', isAuth, shop_controller.postCart)

router.get('/cart', isAuth, shop_controller.getCart)

// router.post('/create-order', isAuth, shop_controller.postOrders)

router.get('/checkout', shop_controller.getCheckout)

router.post('/cart/increaseQuantity', shop_controller.increaseQuantity)

router.post('/cart/decreaseQuantity', shop_controller.decreaseQuantity)

router.post('/delete-cart-item', isAuth, shop_controller.postDeleteCartItem)

router.get('/orders', isAuth, shop_controller.getOrders)

router.get('/orders/:orderId', isAuth, shop_controller.getOrder)

router.get('/checkout/success', shop_controller.getCheckoutSuccess)
router.get('/checkout/cancel', shop_controller.getCheckout)

module.exports = router;