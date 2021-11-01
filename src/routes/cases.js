const Router = require('express')
const mongoose = require('mongoose')
const {body, validationResult} = require('express-validator')
const Case = require('../models/Case')
const User = require('../models/User')
const authMiddleware = require('../middleware/auth')
const {formatErrorMessage} = require('../utils')

const router = new Router()

router.post('/', [
		body('licenseNumber', 'licenseNumber should not be empty').not().isEmpty(),
		body('ownerFullName', 'ownerFullName should not be empty').not().isEmpty(),
		body('type', 'Type value is not valid').matches(/^(sport|general)$/),
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

		const authorizedUser = await User.findOne({_id: req.user.id})

		let officerId
		if (data.officer) {
			const officer = await User.findOne({_id: data.officer})
			if (officer) {
				officerId = officer.id
			}
		}

		const newCase = new Case({
			status: 'new',
			licenseNumber: data.licenseNumber,
			type: data.type,
			ownerFullName: data.ownerFullName,
			clientId: authorizedUser.clientId,
			createdAt: new Date(),
			updatedAt: null,
			color: data.color || null,
			date: data.date || null,
			officer: officerId || null,
			description: data.description || null,
			resolution: null,
		})
		newCase.save()

		return res.json({
			status: 'OK',
			data: newCase
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
	body('status', 'Status is not valid').if(body('status').exists()).matches(/^(new|in_progress|done)$/),
	body('type', 'Type is not valid').if(body('type').exists()).matches(/^(sport|general)$/),
	body('licenseNumber', 'licenseNumber should not be empty').if(body('licenseNumber').exists()).notEmpty(),
	body('ownerFullName', 'ownerFullName should not be empty').if(body('ownerFullName').exists()).notEmpty(),
], authMiddleware, async (req, res) => {
	try {
		const data = req.body
		const caseId = req.params.id

		if (!mongoose.Types.ObjectId.isValid(caseId)) {
			return res.status(400).json({
				status: 'ERR',
				errCode: 'INVALID_ID',
				message: `Неверный формат ID`
			})
		}

		const caseExists = await Case.findOne({_id: caseId})
		if (!caseExists) {
			return res.status(400).json({
				status: 'ERR',
				errCode: 'UNKNOWN_CASE',
				message: `Запись с id ${caseId} не существует`
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

		const authorizedUser = await User.findOne({_id: req.user.id})

		let officerId
		if (data.officer) {
			const officer = await User.findOne({_id: data.officer})
			if (officer) {
				officerId = officer.id
			}
		}

		//!!!TODO: add resolution validation if status is done

		const newCase = {
			status: data.status || caseExists.status,
			licenseNumber: data.licenseNumber || caseExists.licenseNumber,
			type: data.type || caseExists.type,
			ownerFullName: data.ownerFullName || caseExists.ownerFullName,
			clientId: authorizedUser.clientId,
			createdAt: caseExists.createdAt,
			updatedAt: new Date(),
			color: data.color || caseExists.color,
			date: data.date || caseExists.date,
			officer: officerId || caseExists.officerId,
			description: data.description || caseExists.description,
			resolution: data.resolution || caseExists.resolution,
		}

		const updatedCase = await Case.findOneAndUpdate({_id: caseId}, newCase, {returnOriginal: false})
		if (updatedCase) {
			return res.json({
				status: 'OK',
				data: updatedCase,
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
		const caseId = req.params.id

		if (!mongoose.Types.ObjectId.isValid(caseId)) {
			return res.status(400).json({
				status: 'ERR',
				errCode: 'INVALID_ID',
				message: `Неверный формат ID`
			})
		}

		const caseExists = await Case.findOne({_id: caseId})
		if (!caseExists) {
			return res.status(400).json({
				status: 'ERR',
				errCode: 'UNKNOWN_CASE',
				message: `Запись с id ${caseId} не существует`
			})
		}

		const result = await Case.deleteOne({ _id: caseId })

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
		const cases = await Case.find({clientId: authorizedUser.clientId})
		return res.json({
			status: 'OK',
			data: cases || []
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
		const caseId = req.params.id

		if (!mongoose.Types.ObjectId.isValid(caseId)) {
			return res.status(400).json({
				status: 'ERR',
				errCode: 'INVALID_ID',
				message: `Неверный формат ID`
			})
		}

		const caseExists = await Case.findById({_id: caseId})
		if (!caseExists) {
			return res.status(400).json({
				status: 'ERR',
				errCode: 'UNKNOWN_CASE',
				message: `Запись с id ${caseId} не существует`
			})
		}
		return res.json({
			status: 'OK',
			data: caseExists,
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
