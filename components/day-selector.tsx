"use client"

import { DAYS_SHORT, getTodayDayOfWeek } from "@/lib/types"
import { cn } from "@/lib/utils"

interface DaySelectorProps {
  selectedDay: number
  onDayChange: (day: number) => void
}

export function DaySelector({ selectedDay, onDayChange }: DaySelectorProps) {
  const today = getTodayDayOfWeek()

  return (
    <div className="flex gap-1.5">
      {DAYS_SHORT.map((day, index) => (
        <button
          key={day}
          type="button"
          onClick={() => onDayChange(index)}
          className={cn(
            "flex h-10 w-10 flex-col items-center justify-center rounded-lg text-xs font-medium transition-colors sm:h-12 sm:w-14",
            selectedDay === index
              ? "bg-primary text-primary-foreground"
              : index === today
                ? "bg-primary/10 text-primary hover:bg-primary/20"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          <span>{day}</span>
        </button>
      ))}
    </div>
  )
}
