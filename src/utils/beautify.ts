import { beautify } from '@y0unghe/ens.js/utils'

export const tryBeautify = (name: string): string => {
  try {
    return beautify(name)
  } catch (e) {
    return name
  }
}
