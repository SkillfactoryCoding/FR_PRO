const Router = require('express')
const mongoose = require('mongoose')
const {body, validationResult} = require('express-validator')
const bcrypt = require('bcrypt')
const User = require('../models/User')
const authMiddleware = require('../middleware/auth')
const {formatErrorMessage} = require('../utils')

const router = new Router()

router.post('/', [
	body('email', 'Invalid email').isEmail(),
	body('password', 'Password must be longer than 3 and shorter than 12 characters').isLength({min: 3, max: 12})
], authMiddleware, async (req, res) => {
	try {
		const data = req.body

		const errors = validationResult(req)
		if (!errors.isEmpty()) {
			return res.status(400).json({
				status: 'ERR',
				errCode: 'BAD_REQUEST',
				message: `Ошибка при валидации запроса: ${formatErrorMessage(errors.errors)}`,
			})
		}

		const emailExists = await User.findOne({email: data.email})
		if (emailExists) {
			return res.status(400).json({
				status: 'ERR',
				errCode: 'USER_EXISTS',
				message: `Пользователь с email-адресом ${data.email} уже существует в базе данных`
			})
		}
		const authorizedUser = await User.findOne({_id: req.user.id})
		const hashPassword = await bcrypt.hash(data.password, 8)
		const user = new User({
			email: data.email,
			firstName: data.firstName || null,
			lastName: data.lastName || null,
			password: hashPassword,
			clientId: authorizedUser.clientId,
			approved: data.approved || false,
		})
		user.save()
		return res.json({
			status: 'OK',
			data: user,
		})
	} catch (err) {
		console.log(err)
		res.send({
			status: 'ERR',
			errCode: 'SERVER_ERR',
			message: `Произошла ошибка на сервере: ${err}`
		})
	}
})

router.put('/:id', [
	body('password', 'Password must be longer than 3 and shorter than 12 characters')
		.if(body('password').exists()).isLength({min: 3, max: 12})
], authMiddleware, async (req, res) => {
	try {
		const data = req.body
		const officerId = req.params.id

		if (!mongoose.Types.ObjectId.isValid(officerId)) {
			return res.status(400).json({
				status: 'ERR',
				errCode: 'INVALID_ID',
				message: `Неверный формат ID`
			})
		}

		const officerExists = await User.findOne({_id: officerId})
		if (!officerExists) {
			return res.status(400).json({
				status: 'ERR',
				errCode: 'UNKNOWN_USER',
				message: `Сотрудник с id ${officerId} не существует`
			})
		}

		const errors = validationResult(req)
		if (!errors.isEmpty()) {
			return res.status(400).json({
				status: 'ERR',
				errCode: 'BAD_REQUEST',
				message: `Ошибка при валидации запроса: ${formatErrorMessage(errors.errors)}`,
			})
		}

		const isPasswordChanged = data.password && !bcrypt.compareSync(data.password, officerExists.password)
		let newPassword
		if (isPasswordChanged) {
			newPassword = await bcrypt.hash(data.password, 8)
		}

		const officer = {
			firstName: data.firstName || officerExists.firstName,
			lastName: data.lastName || officerExists.lastName,
			password: newPassword || officerExists.password,
			approved: data.approved !== undefined ? data.approved : officerExists.approved,
		}

		const updatedOfficer = await User.findOneAndUpdate({_id: officerId}, officer, {returnOriginal: false})
		if (updatedOfficer) {
			return res.json({
				status: 'OK',
				data: updatedOfficer,
			})
		} else {
			return res.status(400).json({
				status: 'ERR',
				errCode: 'OPERATION_FAILED',
				message: `Не удалось обновить запись с id ${caseId}`
			})
		}

	} catch (err) {
		console.log(err)
		res.send({
			status: 'ERR',
			errCode: 'SERVER_ERR',
			message: `Произошла ошибка на сервере: ${err}`
		})
	}
})

router.delete('/:id', authMiddleware, async (req, res) => {
	try {
		const officerId = req.params.id

		if (!mongoose.Types.ObjectId.isValid(officerId)) {
			return res.status(400).json({
				status: 'ERR',
				errCode: 'INVALID_ID',
				message: `Неверный формат ID`
			})
		}

		const officerExists = await User.findOne({_id: officerId})
		if (!officerExists) {
			return res.status(400).json({
				status: 'ERR',
				errCode: 'UNKNOWN_CASE',
				message: `Сотрудник с id ${officerId} не существует`
			})
		}

		const result = await User.deleteOne({ _id: officerId })

		if (result.deletedCount) {
			return res.json({status: 'OK'})
		} else {
			return res.status(400).json({
				status: 'ERR',
				errCode: 'OPERATION_FAILED',
				message: `Не удалось удалить запись с id ${caseId}`
			})
		}
	} catch (err) {
		console.log(err)
		res.send({
			status: 'ERR',
			errCode: 'SERVER_ERR',
			message: `Произошла ошибка на сервере: ${err}`
		})
	}
})

router.get('/', authMiddleware, async (req, res) => {
	try {
		const authorizedUser = await User.findOne({_id: req.user.id})
		const officers = await User.find({clientId: authorizedUser.clientId})
		return res.json({
			officers: officers || []
		})
	} catch (err) {
		console.log(err)
		res.send({
			status: 'ERR',
			errCode: 'SERVER_ERR',
			message: `Произошла ошибка на сервере: ${err}`
		})
	}
})

router.get('/:id', authMiddleware, async (req, res) => {
	try {
		const officerId = req.params.id

		if (!mongoose.Types.ObjectId.isValid(officerId)) {
			return res.status(400).json({
				status: 'ERR',
				errCode: 'INVALID_ID',
				message: `Неверный формат ID`
			})
		}

		const officerExists = await User.findById(officerId).exec()
		if (!officerExists) {
			return res.status(400).json({
				status: 'ERR',
				errCode: 'UNKNOWN_USER',
				message: `Сотрудник с id ${officerId} не существует`
			})
		}
		return res.json({
			status: 'OK',
			data: officerExists
		})
	} catch (err) {
		console.log(err)
		res.send({
			status: 'ERR',
			errCode: 'SERVER_ERR',
			message: `Произошла ошибка на сервере: ${err}`
		})
	}
})

module.exports = router
