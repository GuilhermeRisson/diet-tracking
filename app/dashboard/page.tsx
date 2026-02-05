"use client"

import { useCallback, useEffect, useState } from "react"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import type { Meal, CheckIn } from "@/lib/types"
import { DAYS_OF_WEEK, getTodayDayOfWeek } from "@/lib/types"
import { DashboardHeader } from "@/components/dashboard-header"
import { DaySelector } from "@/components/day-selector"
import { MealCard } from "@/components/meal-card"
import { AddMealDialog } from "@/components/add-meal-dialog"
import { useNotifications } from "@/hooks/use-notifications"
import { PwaInstallPrompt } from "@/components/pwa-install-prompt"

const supabase = createClient()

async function fetchMeals(): Promise<Meal[]> {
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

async function fetchTodayCheckIns(): Promise<CheckIn[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const today = new Date().toISOString().split("T")[0]

  const { data, error } = await supabase
    .from("check_ins")
    .select("*")
    .eq("user_id", user.id)
    .eq("check_in_date", today)

  if (error) return []
  return data || []
}

export default function DashboardPage() {
  const [selectedDay, setSelectedDay] = useState(getTodayDayOfWeek())

  const {
    data: meals = [],
    mutate: mutateMeals,
  } = useSWR("meals", fetchMeals)

  const {
    data: todayCheckIns = [],
    mutate: mutateCheckIns,
  } = useSWR("today-check-ins", fetchTodayCheckIns)

  // Filter meals for selected day
  const dayMeals = meals.filter((meal) => meal.day_of_week === selectedDay)

  // Get all meals for today for notifications
  const todayMeals = meals.filter(
    (meal) => meal.day_of_week === getTodayDayOfWeek()
  )

  // Enable notifications
  useNotifications(todayMeals)

  // Stats for the selected day
  const isToday = selectedDay === getTodayDayOfWeek()
  const completedCount = isToday
    ? dayMeals.filter((meal) =>
        todayCheckIns.some((ci) => ci.meal_id === meal.id)
      ).length
    : 0
  const totalCount = dayMeals.length

  const handleMealDeleted = useCallback(
    (mealId: string) => {
      mutateMeals(
        (current) => current?.filter((m) => m.id !== mealId),
        false
      )
    },
    [mutateMeals]
  )

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <PwaInstallPrompt />

      <main className="mx-auto max-w-4xl px-4 py-6">
        {/* Day Selector */}
        <div className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              {DAYS_OF_WEEK[selectedDay]}
            </h2>
            {isToday && totalCount > 0 && (
              <p className="text-sm text-muted-foreground">
                {completedCount}/{totalCount} concluidas
              </p>
            )}
          </div>
          <DaySelector selectedDay={selectedDay} onDayChange={setSelectedDay} />
        </div>

        {/* Progress bar for today */}
        {isToday && totalCount > 0 && (
          <div className="mb-6">
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{
                  width: `${(completedCount / totalCount) * 100}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Meals list */}
        <div className="mb-6 flex flex-col gap-3">
          {dayMeals.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mb-3 h-10 w-10 text-muted-foreground/50"
              >
                <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
                <path d="M7 2v20" />
                <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
              </svg>
              <p className="mb-1 text-sm font-medium text-muted-foreground">
                Nenhuma refeicao cadastrada
              </p>
              <p className="text-xs text-muted-foreground/70">
                Adicione suas refeicoes para {DAYS_OF_WEEK[selectedDay]}
              </p>
            </div>
          ) : (
            dayMeals.map((meal) => (
              <MealCard
                key={meal.id}
                meal={meal}
                todayCheckIn={
                  isToday
                    ? todayCheckIns.find((ci) => ci.meal_id === meal.id)
                    : undefined
                }
                onCheckIn={() => mutateCheckIns()}
                onDelete={handleMealDeleted}
              />
            ))
          )}
        </div>

        {/* Add meal button */}
        <div className="flex justify-center">
          <AddMealDialog
            selectedDay={selectedDay}
            onMealAdded={() => mutateMeals()}
          />
        </div>
      </main>
    </div>
  )
}
