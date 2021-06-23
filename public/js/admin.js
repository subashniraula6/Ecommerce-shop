function deleteProduct(btn) {
    const productId = btn.parentNode.querySelector('[name="id"]').value
    const csrf = btn.parentNode.querySelector('[name="_csrf"]').value

    const productElement = btn.closest('article')

    fetch('/admin/product/' + productId, {
        method: 'DELETE',
        headers: {
            'csrf-token': csrf,
        }
    })
        .then(result => {
            return result.json()
        })
        .then(data => {
            console.log(data);
            // productElement.remove(); //Not supported in IE
            productElement.parentNode.removeChild(productElement); //Not supported in IE
        })
        .catch(error => {
            console.log(error)
        })
}