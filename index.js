require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')

const authRouter = require('./src/routes/auth')
const casesRouter = require('./src/routes/cases')
const officersRouter = require('./src/routes/officers')
const publicRouter = require('./src/routes/public')

const uri = process.env.DB_URI
const port = process.env.PORT
const server = express()

server.use(express.json())
server.use('/api/auth', authRouter)
server.use('/api/cases', casesRouter)
server.use('/api/officers', officersRouter)
server.use('/api/public', publicRouter)

const start = async () => {
	try {
		await mongoose.connect(uri)
		server.listen(port, () => {
			console.log(`listening on port ${port}`)
		})
	} catch (err) {

	}
}

start()
