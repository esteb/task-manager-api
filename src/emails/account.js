const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

// sgMail.send({
//     to: 'esteban.gutm@gmail.com',
//     from: 'esteban.gutm@gmail.com',
//     subject: 'This is  my first creation',
//     text: 'I hope this one actually get to you'
// })

const sendWelcomeEmail = ( email, name) => {
    sgMail.send({
        to: email,
        from: 'esteban.gutm@gmail.com',
        subject: 'Thanks for joining in!',
        text: `Welcome to the app, ${name}. Let me know how you get along with the app.`
    })
}

const sendCancelationEmail = ( email, name) => {
    sgMail.send({
        to: email,
        from: 'esteban.gutm@gmail.com',
        subject: 'Cancelation!',
        text: `Estimad@ ${name} tla como nos pediste realizamos la cancelación de tu cuante . ¿Podríamos haber hecho algo para mantenerte abordo?.`
    })
}



module.exports = {
    sendWelcomeEmail
    ,sendCancelationEmail
}