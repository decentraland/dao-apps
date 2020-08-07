const en = require('./en.json')

const locales = en

export function getLocale(appKey) {
  const locale = locales[appKey.toLowerCase()]
  return new Locale(locale)
}

class Locale {
  constructor(data) {
    this.data = data
  }

  get(key) {
    if (!this.data || !this.data[key]) {
      return key
    }

    return this.data[key]
  }
}
