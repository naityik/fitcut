-- Corrects the seeded meal-item macros to the values printed on the packs.
--
-- src/constants/plan.ts is a *seed*: ensureMeals() skips entirely once a phase has
-- meals, so editing the constants only helps a fresh account. This brings rows that
-- were already seeded in line with it.
--
-- Safe to run more than once. Paste into the Supabase SQL editor and run.
-- The SQL editor bypasses RLS, so this touches every user's matching rows — fine for
-- a single-user project, worth a `and user_id = '…'` filter if that ever changes.

-- Bread — pack: 241 kcal / 12.8 P / 41.9 C / 2.4 F per 100 g.
-- A 200 g loaf is 8 slices, so a slice is 25 g.
update public.meal_items
set kcal = 241, protein_g = 12.8, carbs_g = 41.9, fat_g = 2.4,
    portion = '4 slices (100 g)'
where name = 'CD 2X Protein Wheat Bread'
  and portion like '4 slice%';

update public.meal_items
set kcal = 121, protein_g = 6.4, carbs_g = 21, fat_g = 1.2,
    portion = '2 slices (50 g)'
where name = 'CD 2X Protein Wheat Bread'
  and portion like '2 slice%';

-- Idli/dosa batter — pack: 171 kcal / 11.2 P / 27.4 C / 0.4 F per 100 g uncooked.
update public.meal_items
set kcal = 192, protein_g = 12.5, carbs_g = 30.7, fat_g = 0.4,
    portion = '112 g uncooked, made as dosa'
where name = 'CD 2X Protein Idli Dosa Batter';

-- Whey — pack: 112.6 kcal / 24 P / 2.5 C / 0.7 F per 33.3 g scoop.
update public.meal_items
set name = 'MyFitFuel Whey 80 — Milk Masala',
    kcal = 113, protein_g = 24, carbs_g = 2.5, fat_g = 0.7,
    portion = '1 scoop (33.3 g)'
where name in ('MyFitFuel Whey — Masala Milk', 'MyFitFuel Whey 80 — Milk Masala');

-- What the plan adds up to afterwards.
select round(sum(kcal))          as kcal,
       round(sum(protein_g), 1)  as protein_g,
       round(sum(carbs_g), 1)    as carbs_g,
       round(sum(fat_g), 1)      as fat_g
from public.meal_items
where archived = false;
