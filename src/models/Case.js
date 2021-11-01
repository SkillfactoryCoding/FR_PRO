const {Schema, ObjectId, model} = require('mongoose')

const Case = new Schema({
	status: {type: String, required: true, enum: ['new', 'in_progress', 'done']},
	licenseNumber: {type: String, required: true},
	type: {type: String, required: true, enum: ['sport', 'general']},
	ownerFullName: {type: String, required: true},
	clientId: {type: String, required: true},
	createdAt: {type: Date, required: true},
	updatedAt: {type: Date, required: false},
	color: {type: String, required: false},
	date: {type: Date, required: false},
	officer: {type: ObjectId, required: false},
	description: {type: String, required: false},
	resolution: {type: String, required: false},
})

module.exports = model('Case', Case)
