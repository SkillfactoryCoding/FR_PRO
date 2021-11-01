require('dotenv').config()
const jwt = require('jsonwebtoken')

const secretKey = process.env.SECRET_KEY

module.exports = (req, res, next) => {
    if (req.method === 'OPTIONS') {
       return next()
    }

    try {
        const token = req.headers.authorization.split(' ')[1]
        if (!token) {
            return res.status(401).json({message: 'Auth error'})
        }
        const decoded = jwt.verify(token, secretKey)
        req.user = decoded
        next()
    } catch (e) {
        return res.status(401).json({
			status: 'ERR',
			errCode: 'AUTH',
			message: 'Ошибка доступа. Данный запрос доступен только аутентифицированным пользователям.'
		})
    }
}
