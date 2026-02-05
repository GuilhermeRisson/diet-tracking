const CACHE_NAME = "dietacheck-v1"

// Install event - cache essential assets
self.addEventListener("install", (event) => {
  self.skipWaiting()
})

// Activate event - clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim())
})

// Listen for messages from the app to show notifications
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SCHEDULE_CHECK") {
    // The app sends meal data, we store it and check periodically
    if (event.data.meals) {
      self.mealData = event.data.meals
    }
  }

  if (event.data && event.data.type === "SHOW_NOTIFICATION") {
    const { title, body, tag } = event.data
    self.registration.showNotification(title, {
      body,
      tag,
      icon: "/icon-192.jpg",
      badge: "/icon-192.jpg",
      vibrate: [200, 100, 200],
      requireInteraction: true,
      actions: [
        { action: "open", title: "Abrir app" },
      ],
    })
  }
})

// Handle notification click - open the app
self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // If the app is already open, focus it
      for (const client of clientList) {
        if (client.url.includes("/dashboard") && "focus" in client) {
          return client.focus()
        }
      }
      // Otherwise open a new window
      return self.clients.openWindow("/dashboard")
    })
  )
})

// Periodic check using a setInterval approach inside the SW
// This runs as long as the SW is alive
let checkInterval = null

function startMealCheck() {
  if (checkInterval) return

  checkInterval = setInterval(() => {
    if (!self.mealData || !self.mealData.length) return

    const now = new Date()
    const currentHours = String(now.getHours()).padStart(2, "0")
    const currentMinutes = String(now.getMinutes()).padStart(2, "0")
    const currentTime = `${currentHours}:${currentMinutes}`
    const currentDay = now.getDay()
    const today = now.toDateString()

    for (const meal of self.mealData) {
      if (meal.day_of_week !== currentDay) continue

      const mealTime = meal.scheduled_time.slice(0, 5)
      const notifTag = `meal-${meal.id}-${today}`

      if (mealTime === currentTime) {
        self.registration.showNotification(`Hora da ${meal.name}!`, {
          body: `Sao ${mealTime} - hora de fazer sua refeicao.`,
          tag: notifTag,
          icon: "/icon-192.jpg",
          badge: "/icon-192.jpg",
          vibrate: [200, 100, 200],
          requireInteraction: true,
          renotify: false,
          actions: [
            { action: "open", title: "Abrir app" },
          ],
        })
      }
    }
  }, 30000) // check every 30 seconds
}

startMealCheck()
