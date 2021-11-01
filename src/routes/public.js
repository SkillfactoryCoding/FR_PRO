const Router = require('express')
const {body, validationResult} = require('express-validator')
const Case = require('../models/Case')
const {formatErrorMessage} = require('../utils')

const router = new Router()

router.post('/report', [
	body('licenseNumber', 'licenseNumber should not be empty').not().isEmpty(),
	body('ownerFullName', 'ownerFullName should not be empty').not().isEmpty(),
	body('clientId', 'clientId should not be empty').not().isEmpty(),
	body('type', 'Type value is not valid').matches(/^(sport|general)$/),
], (req, res) => {
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

		const newCase = new Case({
			status: 'new',
			licenseNumber: data.licenseNumber,
			type: data.type,
			ownerFullName: data.ownerFullName,
			clientId: data.clientId,
			createdAt: new Date(),
			updatedAt: null,
			color: data.color || null,
			date: data.date || null,
			officer: null,
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

module.exports = router
