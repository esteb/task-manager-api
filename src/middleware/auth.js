//se agregan funciones middleware de expres, esto se agregan antes de configurar la variable app
//tenemos acceso al mismo request

const jwt  = require('jsonwebtoken')
const User = require('../models/user')

const auth = async(req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '')
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const user = await User.findOne({ _id: decoded._id, 'tokens.token': token })

        if(!user) throw new Error() //se crea el Error sin mensaje ya este error activará la captura (catch)

        //como todo lo de arriba salió bien, nos aseguramos que se ejecute el controlador raiz
        req.token = token
        req.user = user  //le enviamos al controlado el usuarios que ya consultamos en la BD para el controlador no tenga que volver a buscarlo
        next()

    } catch (e) {
        res.status(401).send({ error: 'Please authenticate.'})
    }
}

module.exports = auth