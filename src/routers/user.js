const express = require('express')
const User    = require('../models/user')
const auth    = require('../middleware/auth')
const multer  = require('multer')
const sharp   = require('sharp')
const { sendWelcomeEmail, sendCancelationEmail } = require('../emails/account')
const router  = new express.Router()

/*
router.post('/users', (req, res) => {
    const user = new User(req.body)

    user.save().then(()=>{
        res.status(201).send(user) //201 created
    }).catch((e)=>{
        res.status(400).send(e) //PRIMERO cargamos primero el error: Bad Request, luego enviamos la respuesta
    })
    // console.log(req.body)  //imprimo los datos del body del requerimiento enviado por postman
})
*/
// transformando a async await
//   ||
//   \/
router.post('/users', async (req, res) => {
    const user = new User(req.body)

    try{
        await user.save()  //creao al usuario
        sendWelcomeEmail( user.email, user.name)
        const token = await user.generateAuthToken()  //le asocio un token
        res.status(201).send({ user, token })
    } catch (e) {
        res.status(400).send(e)
    }
})


// router.get('/users', (req, res) => {
//     User.find({}).then((users)=>{
//         res.status(200).send(users)
//     }).catch((e)=>{
//         res.status(500).send()
//     })
// })
// transformando a async await
//   ||
//   \/
router.get('/users/me', auth, async (req, res) => {    //el tercer parámetro (auth) es la funcion middleware que definimos en src/middleware/auth ya que la queremos bloquear con la autentificacion, el tercer argumaneto es el manejador de raiz
    res.send(req.user)
})



// router.get('/users/:id', (req, res) => {
//     const _id= req.params.id

//     User.findById(_id).then((user)=>{
//         if(!user) return res.status(404).send()
        
//         res.send(user)
//     }).catch((e)=>{ 
//         res.status(500).send()
//     })
// })
// transformando a async await
//   ||
//   \/
// eliminamos esta ruta ya que esta funcionalidad la realiza la ruta /users/me, y ningun usuario debería consultar por la información de otro usuario
// router.get('/users/:id', async (req, res) => {
//     const _id= req.params.id

//     try {
//         const user = await User.findById(_id)
//         if(!user) return res.status(404).send()
//         res.send(user)
//     } catch (e) {
//         res.status(500).send()
//     }
// })

router.patch('/users/me', auth, async (req, res) => {
    // se cambió la forma de actualizar para poder acceder al evento en el middleware
    
    const updates = Object.keys(req.body) //tomara el objeto y las claves devolverán una matriz de cadenas donde cada una es una propiedad
    const allowedUpdates = ['name' ,'email', 'password', 'age']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if(!isValidOperation) return res.status(400).send({ error: 'Invalid updates!' }) 

    try {
        updates.forEach((update) => req.user[update] = req.body[update] );
        await req.user.save()
        res.send(req.user)
    } catch (e) {
        res.status(400).send(e)
    }
})


//eliminar su propio perfil
router.delete('/users/me', auth, async (req, res) => { 
    try {
        // cambiamos esta 2 lineas por req.user.remove() ya que se agregó al funcion auth del middleware de express
        // const user = await User.findByIdAndDelete(req.user._id)
        // if(!user) return res.status(404).send()

        await req.user.remove()
        sendCancelationEmail( req.user.email, req.user.name)
        res.send(req.user)
    } catch (e) {
        res.status(500).send()
    }
})

router.post('/users/login', async (req, res) => {
    try {
        //utilizamos nuevo método creada en el middleware modesl/user.js
        const user  = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()

        res.send({    user  //establecemos la respuesta del usuario igual a lo que devuelva el metodo json que se estableció en el modelo
                    , token })

    } catch (e) {
        res.status(400).send(e)
    }
})

router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token   //si no son iguales devolvera true manteniendolo en la matriz de tokens, si son iguales devolvera falso y eliminandolo
        })
        await req.user.save()

        res.send()
    } catch (e) {
        res.status(500).send()
    }
})

router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = []
        await req.user.save()
        res.send()
    } catch (e) {
        res.status(500).send()
    }
})


const upload = multer({
    //dest: 'avatars',   //destino. Eliminamos esta linea para que la imagen no se guarde en el directorio, sino que queremos guardarla en la base de datos
    limits: {
        fileSize: 1000000 // limite del tamaño max del archivo a cargar, es en bytes, en este caso 1 mb
    },
    fileFilter(req, file, cb){
        // if (!file.originalname.endsWith('.pdf')) {
            // return cb(new Error('Please upload a PDF'))            
        // }
        
        // if(!file.originalname.match(/\.(doc|docx)$/)) {
        //     return cb(new Error('Please upload a Word document'))            
        // }

        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error('Please upload an Image'))            
        }
        cb(undefined, true)
    }

})

router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
    //res.file contiene todas las propiedades del archivo
    //res.file.buffer contiene un buffer con todos los datos binarios del archivo

     // req.user.avatar = req.file.buffer

    const buffer = await sharp(req.file.buffer).resize({ width:250, height:250}).png().toBuffer()
    req.user.avatar = buffer
    await req.user.save()
    res.send()
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message})
})

router.delete('/users/me/avatar', auth, async (req, res) => { 
    try {
        req.user.avatar = undefined
        await req.user.save()
        res.send(req.user)
    } catch (e) {
        res.status(500).send()
    }
})

router.get('/users/:id/avatar', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)

        if(!user || !user.avatar){
            throw new Error()
        }

        res.set('Content-Type', 'image/png')
        res.send(user.avatar)
    } catch (e) {
        res.status(404).send()
    }
})

module.exports = router