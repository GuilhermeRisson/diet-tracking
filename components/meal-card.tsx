"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Meal, CheckIn } from "@/lib/types"
import { formatTime } from "@/lib/types"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

interface MealCardProps {
  meal: Meal
  todayCheckIn?: CheckIn
  onCheckIn: () => void
  onDelete: (mealId: string) => void
}

export function MealCard({ meal, todayCheckIn, onCheckIn, onDelete }: MealCardProps) {
  const [showCheckInDialog, setShowCheckInDialog] = useState(false)
  const [checkInTime, setCheckInTime] = useState("")
  const [loading, setLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const supabase = createClient()

  const isCompleted = !!todayCheckIn

  async function handleCheckIn() {
    if (!checkInTime) {
      toast.error("Informe o horario que voce fez a refeicao")
      return
    }

    setLoading(true)
    const now = new Date()
    const [hours, minutes] = checkInTime.split(":")
    const completedAt = new Date(now)
    completedAt.setHours(Number.parseInt(hours), Number.parseInt(minutes), 0, 0)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      toast.error("Voce precisa estar logado")
      setLoading(false)
      return
    }

    const { error } = await supabase.from("check_ins").insert({
      meal_id: meal.id,
      user_id: user.id,
      completed_at: completedAt.toISOString(),
      check_in_date: now.toISOString().split("T")[0],
    })

    if (error) {
      toast.error("Erro ao registrar check-in", {
        description: error.message,
      })
    } else {
      toast.success(`${meal.name} marcado como feito!`, {
        description: `Concluido as ${checkInTime}`,
      })
      onCheckIn()
    }

    setShowCheckInDialog(false)
    setCheckInTime("")
    setLoading(false)
  }

  async function handleDelete() {
    const { error } = await supabase.from("meals").delete().eq("id", meal.id)
    if (error) {
      toast.error("Erro ao excluir refeicao")
    } else {
      toast.success("Refeicao excluida")
      onDelete(meal.id)
    }
    setShowDeleteConfirm(false)
  }

  function openCheckIn() {
    const now = new Date()
    setCheckInTime(
      `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
    )
    setShowCheckInDialog(true)
  }

  return (
    <>
      <Card
        className={`transition-all ${
          isCompleted
            ? "border-primary/30 bg-primary/5"
            : "hover:border-border/80"
        }`}
      >
        <CardHeader className="flex flex-row items-start justify-between pb-2">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-semibold text-foreground">
                {meal.name}
              </CardTitle>
              {isCompleted && (
                <Badge
                  variant="secondary"
                  className="bg-primary/10 text-primary text-xs"
                >
                  Feito
                </Badge>
              )}
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              {formatTime(meal.scheduled_time)}
            </p>
          </div>
          <div className="flex items-center gap-1">
            {!isCompleted && (
              <Button
                size="sm"
                onClick={openCheckIn}
                className="h-8 gap-1.5"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-3.5 w-3.5"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Check-in
              </Button>
            )}
            {isCompleted && (
              <p className="text-xs text-muted-foreground">
                {"as "}
                {new Date(todayCheckIn.completed_at).toLocaleTimeString(
                  "pt-BR",
                  { hour: "2-digit", minute: "2-digit" }
                )}
              </p>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-3.5 w-3.5"
              >
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
              <span className="sr-only">Excluir</span>
            </Button>
          </div>
        </CardHeader>
        {meal.meal_items && meal.meal_items.length > 0 && (
          <CardContent className="pt-0">
            <ul className="flex flex-col gap-1">
              {meal.meal_items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary/50" />
                  {item.description}
                </li>
              ))}
            </ul>
          </CardContent>
        )}
      </Card>

      {/* Check-in dialog */}
      <Dialog open={showCheckInDialog} onOpenChange={setShowCheckInDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Marcar {meal.name} como feito</DialogTitle>
            <DialogDescription>
              Que horas voce fez essa refeicao?
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="check-in-time">Horario</Label>
            <Input
              id="check-in-time"
              type="time"
              value={checkInTime}
              onChange={(e) => setCheckInTime(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCheckInDialog(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleCheckIn} disabled={loading}>
              {loading ? "Salvando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Excluir refeicao</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir "{meal.name}"? Essa acao nao pode
              ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
