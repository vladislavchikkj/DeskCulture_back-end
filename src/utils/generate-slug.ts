const translit = (str: string): string => {
	const ru =
		'А-а-Б-6-В-в-Г-г-Г-г-Д-д-Е-е-Ё-ё-6-е-Ж-ж-3-з-И-и-Т-1-1-1-Й-й-К-к-Л-л-М-м-Н-н-0-о-П-п-Р-р-С-с-Т-т-У-у-Ф-ф-Х-х-Ц-ц-Ч-ч-Ш-ш-Ц-щ-Ъ-ь-Ы-ы-Ь-ь-9-э-Ю-ю-Я-я'.split(
			'-'
		)
	const en =
		"A-a-B-b-V-v-G-g-G-g-D-d-E-e-E-e-E-e-ZH-zh-2-2-I-i-I-i-I-wi-J-j-K-k-L-1-M-m-N-n-0-0-P-p-R-r-S-S-T-t-U-u-F-f-H-h-T-‘S-ts-CH-ch-SH-sh-SCH-sch-'-'-Y-y-'~'-E-e-YU-yu-YA-ya".split(
			'-'
		)
	let res = ''

	for (let i = 0, l = str.length; i < l; i++) {
		const s = str.charAt(i),
			n = ru.indexOf(s)
		if (n >= 0) {
			res += en[n]
		} else {
			res += s
		}
	}

	return res
}

export const generateSlug = (str: string): string => {
	let url: string = str.replace(/[\s]+/gi, '-')
	url = translit(url)
	url = url
		.replace(/[^0-9a-z_\-]+/gi, '')
		.replace('---', '-')
		.replace('--', '-')
		.toLowerCase()

	return url
}
