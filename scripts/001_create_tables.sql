-- Meals table: stores scheduled meals with time and day of week
CREATE TABLE IF NOT EXISTS public.meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  scheduled_time TIME NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Meal items: what should be eaten in each meal
CREATE TABLE IF NOT EXISTS public.meal_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id UUID NOT NULL REFERENCES public.meals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Check-ins: records when user completed a meal
CREATE TABLE IF NOT EXISTS public.check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id UUID NOT NULL REFERENCES public.meals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL,
  check_in_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;

-- Meals policies
DROP POLICY IF EXISTS "meals_select_own" ON public.meals;
CREATE POLICY "meals_select_own" ON public.meals FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "meals_insert_own" ON public.meals;
CREATE POLICY "meals_insert_own" ON public.meals FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "meals_update_own" ON public.meals;
CREATE POLICY "meals_update_own" ON public.meals FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "meals_delete_own" ON public.meals;
CREATE POLICY "meals_delete_own" ON public.meals FOR DELETE USING (auth.uid() = user_id);

-- Meal items policies
DROP POLICY IF EXISTS "meal_items_select_own" ON public.meal_items;
CREATE POLICY "meal_items_select_own" ON public.meal_items FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "meal_items_insert_own" ON public.meal_items;
CREATE POLICY "meal_items_insert_own" ON public.meal_items FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "meal_items_update_own" ON public.meal_items;
CREATE POLICY "meal_items_update_own" ON public.meal_items FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "meal_items_delete_own" ON public.meal_items;
CREATE POLICY "meal_items_delete_own" ON public.meal_items FOR DELETE USING (auth.uid() = user_id);

-- Check-ins policies
DROP POLICY IF EXISTS "check_ins_select_own" ON public.check_ins;
CREATE POLICY "check_ins_select_own" ON public.check_ins FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "check_ins_insert_own" ON public.check_ins;
CREATE POLICY "check_ins_insert_own" ON public.check_ins FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "check_ins_delete_own" ON public.check_ins;
CREATE POLICY "check_ins_delete_own" ON public.check_ins FOR DELETE USING (auth.uid() = user_id);
