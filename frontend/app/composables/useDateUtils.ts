import { format, isToday, isTomorrow, isYesterday, addDays, startOfWeek, endOfWeek, isWithinInterval, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'

export const useDateUtils = () => {
  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return 'Non planifié'
    
    const date = parseISO(dateStr)
    
    if (isToday(date)) return "Aujourd'hui"
    if (isTomorrow(date)) return 'Demain'
    if (isYesterday(date)) return 'Hier'
    
    return format(date, 'EEEE d MMMM', { locale: fr })
  }

  const formatTime = (timeStr: string | null): string => {
    if (!timeStr) return ''
    return timeStr
  }

  const getTodayISO = (): string => {
    return format(new Date(), 'yyyy-MM-dd')
  }

  const isDateToday = (dateStr: string | null): boolean => {
    if (!dateStr) return false
    return isToday(parseISO(dateStr))
  }

  const isDateThisWeek = (dateStr: string | null): boolean => {
    if (!dateStr) return false
    const date = parseISO(dateStr)
    const now = new Date()
    const weekStart = startOfWeek(now, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 })
    return isWithinInterval(date, { start: weekStart, end: weekEnd })
  }

  const getWeekDays = (startDate: Date = new Date()): Array<{ date: Date; dateISO: string; dayName: string; dayNumber: number; isToday: boolean }> => {
    const weekStart = startOfWeek(startDate, { weekStartsOn: 1 })
    const days = []
    
    for (let i = 0; i < 7; i++) {
      const date = addDays(weekStart, i)
      days.push({
        date,
        dateISO: format(date, 'yyyy-MM-dd'),
        dayName: format(date, 'EEE', { locale: fr }),
        dayNumber: date.getDate(),
        isToday: isToday(date)
      })
    }
    
    return days
  }

  return {
    formatDate,
    formatTime,
    getTodayISO,
    isDateToday,
    isDateThisWeek,
    getWeekDays
  }
}
