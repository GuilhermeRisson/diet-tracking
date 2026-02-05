"use client"

import { useEffect, useRef, useCallback } from "react"
import type { Meal } from "@/lib/types"
import { formatTime } from "@/lib/types"
import { toast } from "sonner"

async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    })
    return registration
  } catch {
    return null
  }
}

async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "denied"
  }
  if (Notification.permission === "granted") return "granted"
  if (Notification.permission === "denied") return "denied"
  return await Notification.requestPermission()
}

export function useNotifications(meals: Meal[]) {
  const swRegistrationRef = useRef<ServiceWorkerRegistration | null>(null)
  const permissionRef = useRef<NotificationPermission>("default")
  const notifiedRef = useRef<Set<string>>(new Set())

  // Register SW and request permission on mount
  useEffect(() => {
    async function init() {
      const registration = await registerServiceWorker()
      swRegistrationRef.current = registration
      const permission = await requestNotificationPermission()
      permissionRef.current = permission
    }
    init()
  }, [])

  // Send meal data to the Service Worker so it can check even in background
  useEffect(() => {
    if (!swRegistrationRef.current?.active || !meals.length) return

    const simplifiedMeals = meals.map((m) => ({
      id: m.id,
      name: m.name,
      scheduled_time: m.scheduled_time,
      day_of_week: m.day_of_week,
    }))

    swRegistrationRef.current.active.postMessage({
      type: "SCHEDULE_CHECK",
      meals: simplifiedMeals,
    })
  }, [meals])

  // Also check from the client side (for when the tab is open)
  useEffect(() => {
    if (!meals.length) return

    const interval = setInterval(() => {
      const now = new Date()
      const currentHours = String(now.getHours()).padStart(2, "0")
      const currentMinutes = String(now.getMinutes()).padStart(2, "0")
      const currentTime = `${currentHours}:${currentMinutes}`
      const currentDay = now.getDay()

      for (const meal of meals) {
        if (meal.day_of_week !== currentDay) continue

        const mealTime = formatTime(meal.scheduled_time)
        const notifKey = `${meal.id}-${now.toDateString()}`

        if (mealTime === currentTime && !notifiedRef.current.has(notifKey)) {
          notifiedRef.current.add(notifKey)

          // Use Service Worker notification (works on mobile + background)
          if (
            permissionRef.current === "granted" &&
            swRegistrationRef.current
          ) {
            swRegistrationRef.current.showNotification(
              `Hora da ${meal.name}!`,
              {
                body: `Sao ${mealTime} - hora de fazer sua refeicao.`,
                tag: notifKey,
                icon: "/icon-192.jpg",
                badge: "/icon-192.jpg",
                vibrate: [200, 100, 200],
                requireInteraction: true,
              }
            )
          }

          // In-app toast always
          toast.info(`Hora da ${meal.name}!`, {
            description: `Sao ${mealTime} - nao esqueca de marcar como feito.`,
            duration: 10000,
          })
        }
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [meals])
}
