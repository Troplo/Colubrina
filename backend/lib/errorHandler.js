let { Sequelize } = require("../models")
let Errors = require("./errors")
const multer = require("multer")

module.exports = function (err, req, res, next) {
  if (err instanceof Sequelize.ValidationError) {
    res.status(400).json(err)
  } else if (err.name in Errors) {
    res.status(err.status).json({
      errors: [err]
    })
  } else {
    console.error(err)
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          errors: [Errors.fileTooLarge]
        })
      }
    }

    res.status(500).json({
      errors: [Errors.unknown]
    })
  }
}
