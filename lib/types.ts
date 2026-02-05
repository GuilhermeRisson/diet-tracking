export interface Meal {
  id: string
  user_id: string
  name: string
  scheduled_time: string
  day_of_week: number
  created_at: string
  updated_at: string
  meal_items: MealItem[]
  check_ins?: CheckIn[]
}

export interface MealItem {
  id: string
  meal_id: string
  user_id: string
  description: string
  created_at: string
}

export interface CheckIn {
  id: string
  meal_id: string
  user_id: string
  completed_at: string
  check_in_date: string
  created_at: string
}

export const DAYS_OF_WEEK = [
  "Domingo",
  "Segunda",
  "Terca",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sabado",
] as const

export const DAYS_SHORT = [
  "Dom",
  "Seg",
  "Ter",
  "Qua",
  "Qui",
  "Sex",
  "Sab",
] as const

export function formatTime(time: string): string {
  return time.slice(0, 5)
}

export function getDayOfWeek(date: Date): number {
  return date.getDay()
}

export function getTodayDayOfWeek(): number {
  return new Date().getDay()
}
