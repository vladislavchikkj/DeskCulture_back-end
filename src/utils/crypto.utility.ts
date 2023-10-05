import crypto from 'crypto'

export class EncryptionUtility {
	private static readonly ENCRYPTION_KEY = process.env['ENCRYPTION_KEY']
		? Buffer.from(process.env['ENCRYPTION_KEY'], 'hex')
		: crypto.randomBytes(32)
	private static readonly IV_LENGTH = 16

	static encrypt(text: string) {
		let iv = crypto.randomBytes(this.IV_LENGTH)
		let cipher = crypto.createCipheriv(
			'aes-256-cbc',
			Buffer.from(this.ENCRYPTION_KEY),
			iv
		)
		let encrypted = cipher.update(text)
		encrypted = Buffer.concat([encrypted, cipher.final()])
		return iv.toString('hex') + ':' + encrypted.toString('hex')
	}

	static decrypt(text: string) {
		try {
			let textParts = text.split(':')
			let iv = Buffer.from(textParts.shift(), 'hex')
			let encryptedText = Buffer.from(textParts.join(':'), 'hex')
			let decipher = crypto.createDecipheriv(
				'aes-256-cbc',
				Buffer.from(this.ENCRYPTION_KEY),
				iv
			)
			let decrypted = decipher.update(encryptedText)
			decrypted = Buffer.concat([decrypted, decipher.final()])
			return decrypted.toString()
		} catch (error) {
			console.error(`Error decrypting data: ${error.message}`)
			return text
		}
	}
}
