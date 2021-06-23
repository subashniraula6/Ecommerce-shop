const fs = require('fs')
const deleteImage = (imageUrl) => {
    fs.unlink(imageUrl, error => {
        if (error) {
            console.log(error)
        }
    })
}
exports.deleteImage = deleteImage;