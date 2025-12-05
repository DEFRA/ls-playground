import { format, isDate, parseISO } from 'date-fns'

export function formatDate(value, formattedDateStr = 'EEE do MMMM yyyy') {
  const date = isDate(value) ? value : parseISO(value)

  return format(date, formattedDateStr)
}

export function today(value, format) {
  const d = new Date()
  if (format === 'd') return d.getDate()
  if (format === 'm') return d.getMonth() + 1
  if (format === 'y') return d.getFullYear()
}
