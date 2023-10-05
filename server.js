require('dotenv').config()
const express = require('express')
const app = express()
const path = require('path')
const { logger, logEvents } = require('./middleware/logger')
const errorHandler = require('./middleware/errorHandler')
const cookieParser = require('cookie-parser')
const cors = require('cors')
const corsOptions = require('./config/corsOptions')
const dbConn = require('./config/dbConn')
const mongoose = require('mongoose')
const PORT = process.env.PORT || 3500

mongoose.set('strictQuery', true);
dbConn()

// To log reqs into file
app.use(logger)

// Handle the accesses to our api
app.use(cors(corsOptions))

// To receive and parse the json formatted data
app.use(express.json())

// To parse cookies
app.use(cookieParser())

//app.use('/', express.static(path.join(__dirname, '/public')))
app.use(express.static('public'))

app.use('/', require('./routes/root'))
app.use('/auth', require('./routes/authRoutes'))
app.use('/users', require('./routes/userRoutes'))
app.use('/notes', require('./routes/noteRoutes'))

app.all('*', (req, res) => {
    if(req.accepts('html')) {
        res.status(404).sendFile(path.join(__dirname, '/views/404.html'))
    } else if (req.accepts('json')) {
        res.status(404).json({ message: '404 Not Found' })
    } else {
        res.type('txt').send('404 Not Found')
    }
})

app.use(errorHandler)

mongoose.connection.once('open', () => {
    console.log('Connected to MongoDB')
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
})

mongoose.connection.on('error', err => {
    console.log(err)
    logEvents(`${err.no}: ${err.code}\t${err.syscall}\t${err.hostname}`, 'mongoErrLog.log')
})

