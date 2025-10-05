const crypto = require("crypto")

const ALGORITHM = "aes-256-gcm"
const KEY = Buffer.from(process.env.ENCRYPTION_KEY || "default-key-change-in-production", "utf8")

const encrypt = (text) => {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipher(ALGORITHM, KEY)

  let encrypted = cipher.update(text, "utf8", "hex")
  encrypted += cipher.final("hex")

  const authTag = cipher.getAuthTag()

  return {
    encrypted,
    iv: iv.toString("hex"),
    authTag: authTag.toString("hex"),
  }
}

const decrypt = (encryptedData) => {
  const { encrypted, iv, authTag } = encryptedData

  const decipher = crypto.createDecipher(ALGORITHM, KEY)
  decipher.setAuthTag(Buffer.from(authTag, "hex"))

  let decrypted = decipher.update(encrypted, "hex", "utf8")
  decrypted += decipher.final("utf8")

  return decrypted
}

const generateSessionCode = () => {
  return crypto.randomBytes(4).toString("hex").toUpperCase()
}

module.exports = {
  encrypt,
  decrypt,
  generateSessionCode,
}
