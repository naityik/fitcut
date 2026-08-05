-- Removes the duplicate sessions left behind by the old behaviour.
--
-- Picking a second split for a day used to insert another workouts row instead of
-- re-labelling the day's session, so a date can hold a "pull" and a "legs" row with the
-- app only ever showing one of them.
--
-- Only sessions with NO logged exercises are deleted, and only where another session
-- exists for the same day, so nothing you actually recorded can be lost.

-- 1. What you have, worst first.
select log_date,
       count(*)                                as sessions,
       string_agg(split, ', ' order by split)  as splits
from public.workouts
group by log_date
having count(*) > 1
order by log_date desc;

-- 2. Delete the empty duplicates.
delete from public.workouts w
where not exists (
        select 1 from public.workout_exercises we where we.workout_id = w.id
      )
  and exists (
        select 1 from public.workouts other
        where other.user_id = w.user_id
          and other.log_date = w.log_date
          and other.id <> w.id
      );

-- 3. Confirm — should return no rows unless a day genuinely has two logged sessions.
select log_date,
       count(*)                                as sessions,
       string_agg(split, ', ' order by split)  as splits
from public.workouts
group by log_date
having count(*) > 1
order by log_date desc;
