"use client"

import React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { DAYS_OF_WEEK } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"

interface AddMealDialogProps {
  selectedDay: number
  onMealAdded: () => void
}

export function AddMealDialog({ selectedDay, onMealAdded }: AddMealDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [time, setTime] = useState("")
  const [dayOfWeek, setDayOfWeek] = useState(String(selectedDay))
  const [items, setItems] = useState<string[]>([""])
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

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

    setLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      toast.error("Voce precisa estar logado")
      setLoading(false)
      return
    }

    // Create meal
    const { data: meal, error: mealError } = await supabase
      .from("meals")
      .insert({
        user_id: user.id,
        name,
        scheduled_time: time,
        day_of_week: Number.parseInt(dayOfWeek),
      })
      .select()
      .single()

    if (mealError) {
      toast.error("Erro ao criar refeicao", {
        description: mealError.message,
      })
      setLoading(false)
      return
    }

    // Create meal items
    const validItems = items.filter((item) => item.trim() !== "")
    if (validItems.length > 0) {
      const { error: itemsError } = await supabase.from("meal_items").insert(
        validItems.map((description) => ({
          meal_id: meal.id,
          user_id: user.id,
          description: description.trim(),
        }))
      )

      if (itemsError) {
        toast.error("Erro ao adicionar itens", {
          description: itemsError.message,
        })
      }
    }

    toast.success(`${name} adicionado!`)
    setName("")
    setTime("")
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
        if (isOpen) setDayOfWeek(String(selectedDay))
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
            <div className="flex gap-3">
              <div className="flex flex-1 flex-col gap-2">
                <Label htmlFor="meal-time">Horario</Label>
                <Input
                  id="meal-time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-1 flex-col gap-2">
                <Label>Dia da semana</Label>
                <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS_OF_WEEK.map((day, index) => (
                      <SelectItem key={day} value={String(index)}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
