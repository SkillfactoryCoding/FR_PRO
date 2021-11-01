const {Schema, model} = require('mongoose')

const User = new Schema({
	email: {type: String, required: true, unique: true},
	firstName: {type: String, required: false},
	lastName: {type: String, required: false},
	password: {type: String, required: true},
	clientId: {type: String, required: true},
	approved: {type: Boolean, required: true, default: false}
})

module.exports = model('User', User)
