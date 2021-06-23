const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    resetToken: String,
    tokenExpiration: Date,
    cart: {
        items: [
            {
                productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
                quantity: { type: Number, required: true }
            }
        ]
    }
})

userSchema.methods.addToCart = function (product) {

    let newQuantity = 1;
    let updatedCartItems;

    const existingProductIndex = this.cart.items
        .findIndex(prod => {
            return prod.productId.toString() === product._id.toString()
        })

    updatedCartItems = [...this.cart.items]
    if (existingProductIndex >= 0) {
        // increase quantity
        newQuantity = this.cart.items[existingProductIndex].quantity + 1;
        updatedCartItems[existingProductIndex].quantity = newQuantity;
    } else {
        // push product
        updatedCartItems.push({
            productId: product._id,
            quantity: newQuantity
        })
    }
    const updatedCart = {
        items: updatedCartItems
    }
    this.cart = updatedCart;
    return this.save();
}

userSchema.methods.deleteCartItem = function (productId) {
    const updatedCartItems = this.cart.items.filter(item => {
        return item.productId.toString() !== productId.toString()
    })
    this.cart.items = updatedCartItems;
    return this.save()
}

userSchema.methods.increaseQuantity = function (prodId) {
    const updatedCartItems = this.cart.items.map(item => {
        if (item.productId.toString() === prodId.toString()) {
            item.quantity += 1;
        }
        return item;
    })
    this.cart.items = updatedCartItems

    return this.save()
}

userSchema.methods.decreaseQuantity = function (prodId) {
    const updatedCartItems = this.cart.items.map(item => {
        if (item.productId.toString() === prodId.toString()) {
            item.quantity -= 1;
            if (item.quantity <= 1) {
                item.quantity = 1
            }
        }
        return item;
    })
    this.cart.items = updatedCartItems

    return this.save()
}

module.exports = mongoose.model('User', userSchema)