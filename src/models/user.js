const mongoose  = require('mongoose')
const validator = require('validator')
const bcrypt    = require('bcryptjs')
const jwt       = require('jsonwebtoken')
// const task      = require('./task')
const Task = require('./task')

const userSchema = new mongoose.Schema({
                                            name:{
                                                type: String,
                                                required: true,
                                                trim: true
                                            },
                                            email:{
                                                type: String,
                                                unique: true,  //para que esto funcione se debe borrar TODA LA BASE DE DATOS y volver a crear
                                                required: true,
                                                trim: true,
                                                lowercase: true,
                                                validate(value) {
                                                    if(!validator.isEmail(value)){
                                                        throw new Error('Email is invalid')
                                                    }
                                                }
                                            },
                                            age:{
                                                type: Number,
                                                default: 0,
                                                validate(value) {
                                                    if(value < 0){
                                                        throw new Error('Age must be a postive number')
                                                    }
                                                }
                                            },
                                            password: {
                                                type: 'String',
                                                required: true,
                                                trim: true,
                                                minlength: 7,
                                                validate(value){
                                                    if(value.toLowerCase().includes('password')){
                                                        throw new Error('Password cannot contain "password"')
                                                    }
                                                }
                                            }
                                            ,tokens: [{
                                                token: {
                                                    type: String,
                                                    required: true
                                                }
                                            }]
                                            ,avatar: {
                                                type: Buffer //esto permite almacenar el buffer con los datos de imagen binarios directamente en al base de datos
                                            }
                                        }
                                        , //segundo parámetro
                                        {
                                            timestamps: true   //agregamos una marca de tiempo para saber cuando se creó el usuario y cuando de actualizó por última vez
                                        })

//creamos la relacion con la coleccion task, asi podemos deteerminar desde user las task asociadas, obtener las tareas que creó el usuario
userSchema.virtual('tasks'  //nombre de la relacion
                    , {
                        ref: 'Task',
                        localField: '_id', //el campo de user que hace referencia al campo owner de task
                        foreignField: 'owner' //campo de la coleccion task que hace referencia al id de user
                })                                        

//MIDDLEWARE

//creamos "metodos de instacia", ya son accesibles en las instancias, para instancia individual user (u minuscula)
userSchema.methods.toJSON = function () {  //creamos esto para el metodo json en el usuario si necesidad de cambiar algo en el enrutador, lo cual se aplicará para cada envío del usuario
    const user = this
    const userObject = user.toObject()

    delete userObject.password
    delete userObject.tokens
    delete userObject.avatar

    return userObject
}

userSchema.methods.generateAuthToken =  async function () {
    const user = this   //cuando utilizamos this no utilizamos la funcion flecha
    const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET)

    //concatedamos los token y lo guardamos en la base de datos
    user.tokens = user.tokens.concat({ token })
    await user.save()

    return token
}

//estamos creando una funcion que será llamada desde las rutas  routers/user.js
//estos son accesibles en el modelo, aveces llamados "metodos Modelo", para acceder a una coleccion de usuarios con User (u mayuscula)
userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({ email })

    if(!user) throw new Error('Unable to login')

    const isMatch = await bcrypt.compare(password, user.password)

    if(!isMatch) throw new Error('Unable to login')

    return user
}

// existen 2 metodos accesibles para el middleware
//1) pre: para hacer algo antes de un evento, como antes de la validación o antes de guardar
//2) post: para hacer algo justo despues de un evento, por ejemplo, despues de que el usuario haya sido guardado
//que haremos? transformamos la contraseña de texto plano a un hash antes de guardarla
userSchema.pre('save'   //evento
                , async function (next) {

    //this: hace referencia a todo el objeto que va a ser guardado

    const user = this
    
    if(user.isModified('password')){
        user.password = await bcrypt.hash(user.password, 8)  //8 siginfica que se ejecutará 8 veces el algoritmo haciendo la contraseña más segura (8 es lo recomendado por el autor respceto a segurdad vs velocidad)
    }

    next() //se llama a esta funcion al final, siempre al final, si nunca la llamamos la funcion se colgaría para siempre pensando que todavia estamos ejecutando algo de código antes de guardar al usuario
})


//delete task when user is remove
userSchema.pre('remove', async function (next) {
    const user = this
    await Task.deleteMany({ owner: user._id })
    next()
})

const User = mongoose.model('User', userSchema)


module.exports = User