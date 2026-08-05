-- Diagnostic + repair for the unique constraints that upserts depend on.
--
-- `create table if not exists` does nothing to a table that already exists, so a
-- database created from an earlier schema.sql keeps its original shape no matter how
-- many times the script is re-run. A missing unique constraint breaks every upsert
-- against that table with:
--     there is no unique or exclusion constraint matching the ON CONFLICT specification
-- while leaving reads working perfectly — which reads as "it just doesn't save".

-- 1. What exists today.
select c.conrelid::regclass as table_name,
       c.conname,
       pg_get_constraintdef(c.oid) as definition
from pg_constraint c
where c.contype = 'u'
  and c.connamespace = 'public'::regnamespace
order by 1, 2;

-- 2. Add any that are missing. Each is a no-op if an equivalent constraint is there.
do $$
begin
  if not exists (select 1 from pg_constraint
                 where conrelid = 'public.workouts'::regclass and contype = 'u'
                   and pg_get_constraintdef(oid) like '%user_id, log_date, split%') then
    alter table public.workouts
      add constraint workouts_user_date_split_key unique (user_id, log_date, split);
  end if;

  if not exists (select 1 from pg_constraint
                 where conrelid = 'public.weight_entries'::regclass and contype = 'u'
                   and pg_get_constraintdef(oid) like '%user_id, log_date%') then
    alter table public.weight_entries
      add constraint weight_entries_user_date_key unique (user_id, log_date);
  end if;

  if not exists (select 1 from pg_constraint
                 where conrelid = 'public.meal_item_checks'::regclass and contype = 'u'
                   and pg_get_constraintdef(oid) like '%meal_item_id, log_date%') then
    alter table public.meal_item_checks
      add constraint meal_item_checks_item_date_key unique (meal_item_id, log_date);
  end if;

  if not exists (select 1 from pg_constraint
                 where conrelid = 'public.daily_metrics'::regclass and contype = 'u'
                   and pg_get_constraintdef(oid) like '%user_id, log_date, metric_key%') then
    alter table public.daily_metrics
      add constraint daily_metrics_user_date_key_key unique (user_id, log_date, metric_key);
  end if;
end $$;

-- 3. Confirm.
select c.conrelid::regclass as table_name, pg_get_constraintdef(c.oid) as definition
from pg_constraint c
where c.contype = 'u' and c.connamespace = 'public'::regnamespace
order by 1;
