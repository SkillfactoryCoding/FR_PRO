const formatErrorMessage = (errors) => {
	return errors.reduce((msg, err) => msg += `${err.msg}, `, '').slice(0, -2)
}

module.exports = { formatErrorMessage }
