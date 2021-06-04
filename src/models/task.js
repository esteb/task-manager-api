const mongoose = require('mongoose')

const taskSchema = new mongoose.Schema({
                                            description: {
                                                type: 'String',
                                                trim: true,
                                                required: true
                                            },
                                            completed: {
                                                type: Boolean,
                                                default: false
                                            },
                                            owner: {
                                                type: mongoose.Schema.Types.ObjectId,
                                                required: true,
                                                ref: 'User'    //hace referencia de este campo hacia otro modelo
                                            }
                                        } 
                                        , //segundo parámetro
                                        {
                                            timestamps: true   //agregamos una marca de tiempo para saber cuando se creó la tarea y cuando de actualizó por última vez
                                        })

const Task = mongoose.model('Task', taskSchema)

module.exports = Task