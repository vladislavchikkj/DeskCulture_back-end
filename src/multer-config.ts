import { diskStorage } from 'multer'
import { extname } from 'path'

export const multerConfig = {
	storage: diskStorage({
		destination: './uploads', // установить целевую директорию для загрузки файлов
		filename: (req, file, cb) => {
			const fileExt = extname(file.originalname)
			const randomName = Array(32)
				.fill(null)
				.map(() => Math.round(Math.random() * 16).toString(16))
				.join('')
			cb(null, `${randomName}${fileExt}`)
		}
	}),
	fileFilter: (req, file, cb) => {
		if (!['image/jpeg', 'image/png'].includes(file.mimetype)) {
			cb(new Error('Invalid file type'), false)
		} else {
			cb(null, true)
		}
	},
	limits: { fileSize: 5 * 1024 * 1024 } // установить предельный размер файла: 2 MB
}
