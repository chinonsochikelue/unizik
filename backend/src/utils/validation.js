const Joi = require("joi")

const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required()
    .messages({
      "string.pattern.base":
        "Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character",
    }),
  role: Joi.string().valid("ADMIN", "TEACHER", "STUDENT").required(),
})

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
})

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required(),
})

const createClassSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  description: Joi.string().max(500).optional(),
  teacherId: Joi.string().required(),
})

const startSessionSchema = Joi.object({
  classId: Joi.string().required(),
})

const markAttendanceSchema = Joi.object({
  studentId: Joi.string().required(),
  sessionId: Joi.string().required(),
})

const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body)
    if (error) {
      return res.status(400).json({
        error: "Validation error",
        details: error.details.map((detail) => detail.message),
      })
    }
    next()
  }
}

module.exports = {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  createClassSchema,
  startSessionSchema,
  markAttendanceSchema,
  validateRequest,
}
