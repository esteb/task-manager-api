const express = require('express')
const Task    = require('../models/task')
const auth    = require('../middleware/auth')
const router  = new express.Router()


// router.post('/tasks', (req, res) => {
//     const task = new Task(req.body)

//     task.save().then(()=>{
//         res.status(201).send(task)
//     }).catch((e)=>{
//         res.status(400).send(e)
//     })
// })
// transformando a async await
//   ||
//   \/
router.post('/tasks', auth, async (req, res) => {
    // const task = new Task(req.body)
    const task = new Task({
        ...req.body,  //esto copia toda las propiedades de req.body al objeto {} que estamos creando
        owner: req.user._id   //el id del user que acabamos de autentificar
    })

    try {
        await task.save()
        res.status(201).send(task)
    } catch (e) {
        res.status(400).send(e)
    }
})



// router.get('/tasks', (req, res) => {
//     Task.find({}).then((tasks) => {
//         if(!tasks) return res.status(404).send()
        
//         res.send(tasks)
//     }).catch((e) => {
//         res.status(500).send()
//     })
// })
// transformando a async await
//   ||
//   \/
//GET /tasks?completed=true
//paginacion: limit, skip /tasks?limit=2&skip=0
// limit= cantidad de tareas a mostrar en cada página
//skip  = las tareas a mostrar
//ej: limit=2, skp=0, muestra las 2 primera tareas
//    limit=2, skp=2, muestra la 3° y 4° tarea
// GET /tasks?sortBy=createdAt:desc
//  clasificacion: ordenadas por el campo createdAt, y ordenadas descrecientemente, o ascendentemente
router.get('/tasks', auth, async (req, res) => {

    const match = {}
    const sort = {}

    if(req.query.completed){
        match.completed = req.query.completed === 'true'  //si el string proporcionado es igual 'true' retornará true, si es distinto a 'true' retornará false, y se guardará en el objeto
    }

    if (req.query.sortBy) {
        const parts = req.query.sortBy.split(':')
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1 //operador ternario: si parts[1] es igual a desc sera -1 sino 1  //estoy agarrando el 1° elemento de la matriz y con los [] lo estoy usando como el nombre de la propiedad
    }

    try {
        //opción 1
        // const tasks = await Task.find({ owner: req.user._id })
        // res.send(tasks)

        //busca un usuario y lo pobla con sus tareas usando la relacion virtual creada en el modelo de usuario: userSchema.virtual('tasks'...
        //opción 2
        // await req.user.populate('tasks').execPopulate()

        //para aplicar filtros:
        await req.user.populate({
            path: 'tasks',   //tiene que ser la palabra tasks y no task, ya que tasks fue la que se definió en el modelo de usuario
            match,   // es igual a  match: macth
            options: {
                limit: parseInt(req.query.limit),  //transforma el string proporsionado a entero, si no se proporciona este valor mongoose lo ignorará
                skip : parseInt(req.query.skip),
                sort
            }
        }).execPopulate()

        res.send(req.user.tasks)


    } catch (e) {
        res.status(500).send()
    }
})



// router.get('/tasks/:id', (req, res) => {
//     const _id= req.params.id

//     Task.findById(_id).then((task) => {
//         if(!task) return res.status(404).send()
        
//         res.send(task)
//     }).catch((e) => {
//         res.status(500).send()
//     })
// })
// transformando a async await
//   ||
//   \/
router.get('/tasks/:id', auth, async (req, res) => {
    const _id= req.params.id
    try {
        const task = await Task.findOne({ _id, owner: req.user._id })
        if(!task) return res.status(404).send()
        res.send(task)
    } catch (e) {
        res.status(500).send()
    }
})

router.patch('/tasks/:id', auth, async (req, res) => {
    
    const updates = Object.keys(req.body)
    const allowedUpdates = ['description' ,'completed']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if(!isValidOperation) return res.status(400).send({ error: 'Invalid updates!' }) 

    try {
        const task = await Task.findOne({ _id: req.params.id, owner: req.user._id })

        // const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
        
        if(!task) return res.status(404).send()

        updates.forEach((update) => task[update] = req.body[update] );
        await task.save()

        res.send(task)
    } catch (e) {
        res.status(400).send(e)
    }
})

router.delete('/tasks/:id', auth, async (req, res) => {
    try {
        const task = await Task.findOneAndDelete({ _id: req.params.id, owner: req.user._id })
        if(!task) return res.status(404).send()
        res.send(task)
    } catch (e) {
        res.status(500).send()
    }
})

module.exports = router