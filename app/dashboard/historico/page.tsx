"use client"

import { useState } from "react"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import type { Meal, CheckIn } from "@/lib/types"
import { DAYS_OF_WEEK, DAYS_SHORT, formatTime } from "@/lib/types"
import { DashboardHeader } from "@/components/dashboard-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const supabase = createClient()

const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Marco",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
]

async function fetchAllMeals(): Promise<Meal[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from("meals")
    .select("*, meal_items(*)")
    .eq("user_id", user.id)
    .order("scheduled_time", { ascending: true })

  if (error) return []
  return data || []
}

async function fetchAllCheckIns(): Promise<CheckIn[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from("check_ins")
    .select("*")
    .eq("user_id", user.id)
    .order("check_in_date", { ascending: false })

  if (error) return []
  return data || []
}

function getWeeksInMonth(year: number, month: number) {
  const weeks: Date[][] = []
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  let currentWeek: Date[] = []
  // Pad start of month
  const startPadding = firstDay.getDay()
  for (let i = 0; i < startPadding; i++) {
    const d = new Date(year, month, 1 - (startPadding - i))
    currentWeek.push(d)
  }

  for (let day = 1; day <= lastDay.getDate(); day++) {
    const date = new Date(year, month, day)
    currentWeek.push(date)
    if (currentWeek.length === 7) {
      weeks.push(currentWeek)
      currentWeek = []
    }
  }

  // Pad end
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      const lastDate = currentWeek[currentWeek.length - 1]
      const nextDate = new Date(lastDate)
      nextDate.setDate(nextDate.getDate() + 1)
      currentWeek.push(nextDate)
    }
    weeks.push(currentWeek)
  }

  return weeks
}

export default function HistoricoPage() {
  const now = new Date()
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth())
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())
  const [selectedDate, setSelectedDate] = useState<string | null>(
    now.toISOString().split("T")[0]
  )

  const { data: meals = [] } = useSWR("all-meals", fetchAllMeals)
  const { data: checkIns = [] } = useSWR("all-check-ins", fetchAllCheckIns)

  const weeks = getWeeksInMonth(selectedYear, selectedMonth)

  // Calculate compliance for each day
  function getDayCompliance(date: Date) {
    const dateStr = date.toISOString().split("T")[0]
    const dayOfWeek = date.getDay()
    const dayMeals = meals.filter((m) => m.day_of_week === dayOfWeek)
    const dayCheckIns = checkIns.filter((ci) => ci.check_in_date === dateStr)

    if (dayMeals.length === 0) return { total: 0, completed: 0, rate: 0 }

    const completed = dayMeals.filter((meal) =>
      dayCheckIns.some((ci) => ci.meal_id === meal.id)
    ).length

    return {
      total: dayMeals.length,
      completed,
      rate: dayMeals.length > 0 ? completed / dayMeals.length : 0,
    }
  }

  // Get details for selected date
  function getSelectedDayDetails() {
    if (!selectedDate) return []
    const date = new Date(selectedDate + "T12:00:00")
    const dayOfWeek = date.getDay()
    const dayMeals = meals.filter((m) => m.day_of_week === dayOfWeek)
    const dayCheckIns = checkIns.filter(
      (ci) => ci.check_in_date === selectedDate
    )

    return dayMeals.map((meal) => {
      const checkIn = dayCheckIns.find((ci) => ci.meal_id === meal.id)
      return { meal, checkIn }
    })
  }

  const selectedDetails = getSelectedDayDetails()

  // Monthly stats
  const monthDays: Date[] = []
  const firstDay = new Date(selectedYear, selectedMonth, 1)
  const lastDay = new Date(selectedYear, selectedMonth + 1, 0)
  for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
    if (d <= now) {
      monthDays.push(new Date(d))
    }
  }

  const monthStats = monthDays.reduce(
    (acc, date) => {
      const comp = getDayCompliance(date)
      acc.total += comp.total
      acc.completed += comp.completed
      return acc
    },
    { total: 0, completed: 0 }
  )

  const monthRate =
    monthStats.total > 0
      ? Math.round((monthStats.completed / monthStats.total) * 100)
      : 0

  function navigateMonth(dir: number) {
    let m = selectedMonth + dir
    let y = selectedYear
    if (m < 0) {
      m = 11
      y--
    }
    if (m > 11) {
      m = 0
      y++
    }
    setSelectedMonth(m)
    setSelectedYear(y)
    setSelectedDate(null)
  }

  const todayStr = now.toISOString().split("T")[0]

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="mx-auto max-w-4xl px-4 py-6">
        {/* Month navigation */}
        <div className="mb-6 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigateMonth(-1)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </Button>
          <h2 className="text-lg font-semibold text-foreground">
            {MONTHS[selectedMonth]} {selectedYear}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigateMonth(1)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          </Button>
        </div>

        {/* Monthly summary */}
        <div className="mb-6 grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="flex flex-col items-center py-4">
              <p className="text-2xl font-bold text-primary">{monthRate}%</p>
              <p className="text-xs text-muted-foreground">Aderencia</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col items-center py-4">
              <p className="text-2xl font-bold text-foreground">
                {monthStats.completed}
              </p>
              <p className="text-xs text-muted-foreground">Concluidas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col items-center py-4">
              <p className="text-2xl font-bold text-foreground">
                {monthStats.total}
              </p>
              <p className="text-xs text-muted-foreground">Total</p>
            </CardContent>
          </Card>
        </div>

        {/* Calendar grid */}
        <Card className="mb-6">
          <CardContent className="p-3">
            <div className="mb-2 grid grid-cols-7 gap-1">
              {DAYS_SHORT.map((day) => (
                <div
                  key={day}
                  className="py-1 text-center text-xs font-medium text-muted-foreground"
                >
                  {day}
                </div>
              ))}
            </div>
            {weeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 gap-1">
                {week.map((date, di) => {
                  const dateStr = date.toISOString().split("T")[0]
                  const isCurrentMonth = date.getMonth() === selectedMonth
                  const isFuture = date > now
                  const isSelected = selectedDate === dateStr
                  const isToday = dateStr === todayStr
                  const compliance = !isFuture && isCurrentMonth
                    ? getDayCompliance(date)
                    : null

                  let bgClass = ""
                  if (compliance && compliance.total > 0) {
                    if (compliance.rate === 1) {
                      bgClass = "bg-primary text-primary-foreground"
                    } else if (compliance.rate >= 0.5) {
                      bgClass = "bg-primary/30 text-foreground"
                    } else if (compliance.rate > 0) {
                      bgClass = "bg-primary/10 text-foreground"
                    }
                  }

                  return (
                    <button
                      key={di}
                      type="button"
                      disabled={isFuture || !isCurrentMonth}
                      onClick={() => setSelectedDate(dateStr)}
                      className={`flex h-9 w-full items-center justify-center rounded-md text-xs font-medium transition-colors sm:h-10
                        ${!isCurrentMonth ? "text-muted-foreground/30" : ""}
                        ${isFuture ? "cursor-not-allowed opacity-30" : ""}
                        ${isSelected ? "ring-2 ring-primary ring-offset-1 ring-offset-background" : ""}
                        ${isToday && !bgClass ? "border border-primary text-primary" : ""}
                        ${bgClass || (isCurrentMonth && !isFuture ? "hover:bg-muted" : "")}
                      `}
                    >
                      {date.getDate()}
                    </button>
                  )
                })}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Selected day details */}
        {selectedDate && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">
                {new Date(selectedDate + "T12:00:00").toLocaleDateString(
                  "pt-BR",
                  {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  }
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedDetails.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  Nenhuma refeicao cadastrada para este dia da semana.
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {selectedDetails.map(({ meal, checkIn }) => (
                    <div
                      key={meal.id}
                      className="flex items-start justify-between rounded-lg border border-border p-3"
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">
                            {meal.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatTime(meal.scheduled_time)}
                          </span>
                        </div>
                        {meal.meal_items && meal.meal_items.length > 0 && (
                          <ul className="flex flex-col gap-0.5">
                            {meal.meal_items.map((item) => (
                              <li
                                key={item.id}
                                className="text-xs text-muted-foreground"
                              >
                                {item.description}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {checkIn ? (
                          <Badge className="bg-primary/10 text-primary hover:bg-primary/10">
                            {"Feito as "}
                            {new Date(checkIn.completed_at).toLocaleTimeString(
                              "pt-BR",
                              { hour: "2-digit", minute: "2-digit" }
                            )}
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="text-muted-foreground"
                          >
                            {new Date(selectedDate + "T12:00:00") > now
                              ? "Pendente"
                              : "Nao feito"}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
