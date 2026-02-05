"use client"

import { useEffect, useRef, useCallback } from "react"
import type { Meal } from "@/lib/types"
import { formatTime } from "@/lib/types"
import { toast } from "sonner"

export function useNotifications(meals: Meal[]) {
  const permissionRef = useRef<NotificationPermission>("default")
  const notifiedRef = useRef<Set<string>>(new Set())

  const requestPermission = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return
    if (Notification.permission === "granted") {
      permissionRef.current = "granted"
      return
    }
    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission()
      permissionRef.current = permission
    }
  }, [])

  useEffect(() => {
    requestPermission()
  }, [requestPermission])

  useEffect(() => {
    if (!meals.length) return

    const interval = setInterval(() => {
      const now = new Date()
      const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
      const currentDay = now.getDay()

      for (const meal of meals) {
        if (meal.day_of_week !== currentDay) continue

        const mealTime = formatTime(meal.scheduled_time)
        const notifKey = `${meal.id}-${now.toDateString()}`

        if (mealTime === currentTime && !notifiedRef.current.has(notifKey)) {
          notifiedRef.current.add(notifKey)

          // Browser notification
          if (
            permissionRef.current === "granted" &&
            typeof Notification !== "undefined"
          ) {
            new Notification(`Hora da ${meal.name}!`, {
              body: `Sao ${mealTime} - hora de fazer sua refeicao.`,
              icon: "/favicon.ico",
            })
          }

          // In-app toast
          toast.info(`Hora da ${meal.name}!`, {
            description: `Sao ${mealTime} - nao esqueca de marcar como feito.`,
            duration: 10000,
          })
        }
      }
    }, 30000) // Check every 30 seconds

    return () => clearInterval(interval)
  }, [meals])
}
