const Joi = require("joi")

const registerSchema = Joi.object({
  firstName: Joi.string().min(1).max(50).required(),
  lastName: Joi.string().min(1).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$.,!%*?&])[A-Za-z\d@$.,!%*?&]/)
    .required()
    .messages({
      "string.pattern.base":
        "Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character",
    }),
  role: Joi.string().valid("ADMIN", "TEACHER", "STUDENT").required(),
  studentId: Joi.string().optional(),
  teacherId: Joi.string().optional(),
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
  biometricToken: Joi.string().required(),
})

const updateProfileSchema = Joi.object({
  firstName: Joi.string().min(1).max(50).optional(),
  lastName: Joi.string().min(1).max(50).optional(),
  email: Joi.string().email().optional(),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*._?&]/)
    .optional()
    .messages({
      "string.pattern.base":
        "Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character",
    }),
  currentPassword: Joi.string()
    .when("password", {
      is: Joi.exist(),
      then: Joi.required(),
      otherwise: Joi.optional(),
    })
    .messages({
      "any.required": "Current password is required when updating password",
    }),
})
  .min(1)
  .messages({
    "object.min": "At least one field must be provided for update",
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
  updateProfileSchema, // Exported new schema
  validateRequest,
}
