require('dotenv').config()
const Router = require('express')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const {body, validationResult} = require('express-validator')
const User = require('../models/User')
const {formatErrorMessage} = require('../utils')

const secretKey = process.env.SECRET_KEY
const router = new Router()

router.post('/sign_up', [
	body('clientId', 'clientId should not be empty').not().isEmpty(),
	body('email', 'Invalid email').isEmail(),
	body('password', 'Password must be longer than 3 and shorter than 12 characters').isLength({min: 3, max: 12})
],
async (req, res) => {
	try {
		const {email, password, clientId} = req.body
		const emailExists = await User.findOne({email})
		if (emailExists) {
			return res.status(400).json({
				status: 'ERR',
				errCode: 'USER_EXISTS',
				message: `Пользователь с email-адресом ${email} уже существует в базе данных`
			})
		}

		const errors = validationResult(req)
		if (!errors.isEmpty()) {
            return res.status(400).json({
				status: 'ERR',
				errCode: 'BAD_REQUEST',
				message: `Ошибка при валидации запроса: ${formatErrorMessage(errors.errors)}`
			})
        }

		const hashPassword = await bcrypt.hash(password, 8)

		// aprroved=true only for first registered user
		const usersCount = await User.count({clientId})
		const isApproved = usersCount < 1

		const user = new User({email, password: hashPassword, approved: isApproved, clientId})
		user.save()
		return res.json({
			status: 'OK'
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

router.post('/sign_in', async (req, res) => {
	try {
		const {email, password} = req.body
		const user = await User.findOne({email})
		if (!user) {
			return res.status(400).json({
				status: 'ERR',
				errCode: 'UNKNOWN_USER',
				message: `Пользователь с email-адресом ${email} не существует`
			})
		}

		const isPasswordValid = bcrypt.compareSync(password, user.password)
		if (!isPasswordValid) {
			return res.status(400).json({
				status: 'ERR',
				errCode: 'INVALID_PASSWORD',
				message: 'Неверный пароль'
			})
		}

		const token = jwt.sign({id: user.id}, secretKey, {expiresIn: '7d'})

		return res.json({
			status: 'OK',
			data: {
				token,
				user,
			}
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
