const express = require('express')

//esto no toma nada del archivo si que se asegura que este archivo se ejecute y 
// asegurará que Mongoose se conecte a la base de datos
require('./db/mongoose')

const userRouter = require('./routers/user')
const taskRouter = require('./routers/task')

const app = express()
const port = process.env.PORT


//se agregan funciones middleware de expres, esto se agregan antes de configurar la variable app
//tenemos acceso al mismo request
// app.use((req, res, next) => { 
//     console.log(req.method, req.path)
//     res.status(503).send('Servidor fuera de servicio por matenimiento')
// })




//transformará  el json entrante a un objeto para que  podamos acceder a el en nuestros manejadores de solicitudes
app.use(express.json())

//carga las rutas
app.use(userRouter)
app.use(taskRouter)

app.listen(port, ()=>{
    console.log('Server is up on port ' + port)
})


