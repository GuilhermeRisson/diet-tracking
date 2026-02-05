"use client"

import { SelectItem } from "@/components/ui/select"
import { SelectContent } from "@/components/ui/select"
import { SelectValue } from "@/components/ui/select"
import { SelectTrigger } from "@/components/ui/select"
import { Select } from "@/components/ui/select"
import React from "react"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { DAYS_OF_WEEK } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"

interface AddMealDialogProps {
  selectedDay: number
  onMealAdded: () => void
}

export function AddMealDialog({ selectedDay, onMealAdded }: AddMealDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [time, setTime] = useState("")
  const [selectedDays, setSelectedDays] = useState<number[]>([selectedDay])
  const [items, setItems] = useState<string[]>([""])
  const [loading, setLoading] = useState(false)
  const [dayOfWeek, setDayOfWeek] = useState(String(selectedDay))
  const supabase = createClient()

  const allDaysSelected = selectedDays.length === 7

  function toggleDay(day: number) {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    )
  }

  function toggleAllDays() {
    if (allDaysSelected) {
      setSelectedDays([selectedDay])
    } else {
      setSelectedDays([0, 1, 2, 3, 4, 5, 6])
    }
  }

  function addItemField() {
    setItems([...items, ""])
  }

  function updateItem(index: number, value: string) {
    const newItems = [...items]
    newItems[index] = value
    setItems(newItems)
  }

  function removeItem(index: number) {
    if (items.length === 1) return
    const newItems = items.filter((_, i) => i !== index)
    setItems(newItems)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name || !time) {
      toast.error("Preencha o nome e o horario")
      return
    }
    if (selectedDays.length === 0) {
      toast.error("Selecione pelo menos um dia da semana")
      return
    }

    setLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      toast.error("Voce precisa estar logado")
      setLoading(false)
      return
    }

    // Create a meal for each selected day
    const mealInserts = selectedDays.map((day) => ({
      user_id: user.id,
      name,
      scheduled_time: time,
      day_of_week: day,
    }))

    const { data: meals, error: mealError } = await supabase
      .from("meals")
      .insert(mealInserts)
      .select()

    if (mealError || !meals) {
      toast.error("Erro ao criar refeicao", {
        description: mealError?.message,
      })
      setLoading(false)
      return
    }

    // Create meal items for each created meal
    const validItems = items.filter((item) => item.trim() !== "")
    if (validItems.length > 0) {
      const itemInserts = meals.flatMap((meal) =>
        validItems.map((description) => ({
          meal_id: meal.id,
          user_id: user.id,
          description: description.trim(),
        }))
      )

      const { error: itemsError } = await supabase
        .from("meal_items")
        .insert(itemInserts)

      if (itemsError) {
        toast.error("Erro ao adicionar itens", {
          description: itemsError.message,
        })
      }
    }

    const dayLabel =
      selectedDays.length === 7
        ? "todos os dias"
        : selectedDays.length === 1
          ? DAYS_OF_WEEK[selectedDays[0]]
          : `${selectedDays.length} dias`
    toast.success(`${name} adicionado para ${dayLabel}!`)
    setName("")
    setTime("")
    setSelectedDays([selectedDay])
    setItems([""])
    setOpen(false)
    setLoading(false)
    onMealAdded()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen)
        if (isOpen) setSelectedDays([selectedDay])
      }}
    >
      <DialogTrigger asChild>
        <Button className="gap-2">
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
            <path d="M5 12h14" />
            <path d="M12 5v14" />
          </svg>
          Nova Refeicao
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Nova Refeicao</DialogTitle>
            <DialogDescription>
              Cadastre uma refeicao com horario e o que deve ser feito.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="meal-name">Nome da refeicao</Label>
              <Input
                id="meal-name"
                placeholder="Ex: Almoco, Lanche, Janta..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="meal-time">Horario</Label>
              <Input
                id="meal-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Dias da semana</Label>
              <div className="flex items-center gap-2 rounded-md border border-border p-3">
                <Checkbox
                  id="all-days"
                  checked={allDaysSelected}
                  onCheckedChange={toggleAllDays}
                />
                <label
                  htmlFor="all-days"
                  className="cursor-pointer text-sm font-medium text-foreground"
                >
                  Todos os dias
                </label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {DAYS_OF_WEEK.map((day, index) => (
                  <div
                    key={day}
                    className="flex items-center gap-2 rounded-md border border-border px-3 py-2"
                  >
                    <Checkbox
                      id={`day-${index}`}
                      checked={selectedDays.includes(index)}
                      onCheckedChange={() => toggleDay(index)}
                    />
                    <label
                      htmlFor={`day-${index}`}
                      className="cursor-pointer text-sm text-foreground"
                    >
                      {day}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Itens da refeicao</Label>
              <div className="flex flex-col gap-2">
                {items.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="Ex: Arroz integral, Frango grelhado..."
                      value={item}
                      onChange={(e) => updateItem(index, e.target.value)}
                    />
                    {items.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => removeItem(index)}
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
                          <path d="M18 6 6 18" />
                          <path d="m6 6 12 12" />
                        </svg>
                        <span className="sr-only">Remover item</span>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-1 w-fit bg-transparent"
                onClick={addItemField}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-1.5 h-3.5 w-3.5"
                >
                  <path d="M5 12h14" />
                  <path d="M12 5v14" />
                </svg>
                Adicionar item
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
