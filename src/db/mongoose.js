const mongoose = require('mongoose')

mongoose.connect( process.env.MONGODB_URL, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false  //elimina los mensajes de alerta de algun metodo que ya está en desuso (deprecated) 
})