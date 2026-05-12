import { formatDistanceToNow, format, isAfter, addHours } from 'date-fns'
import { de } from 'date-fns/locale'

export function formatRelativeTime(date: string | Date): string {
  return formatDistanceToNow(new Date(date), {
    addSuffix: true,
    locale: de,
  })
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), 'dd.MM.yyyy HH:mm')
}

export function isPromiseDueSoon(dueDate: string | Date): boolean {
  return isAfter(addHours(new Date(), 24), new Date(dueDate))
}

export function isPromiseOverdue(dueDate: string | Date): boolean {
  return isAfter(new Date(), new Date(dueDate))
}
