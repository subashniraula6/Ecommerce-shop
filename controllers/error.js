exports.get404 = (req, res, next) => {
    res.status(404).render('error/404', {
        pageTitle: 'Page Not Found',
        url: '/404'
    })
}

exports.get500 = (req, res, next) => {
    res.status(500).render('error/500', {
        pageTitle: 'Error!',
        url: '/500',
        isAuthenticated: req.session.isLoggedIn
    })
}