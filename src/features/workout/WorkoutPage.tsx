import * as React from "react";
import { Dumbbell, Plus } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState, Segmented, Skeleton } from "@/components/ui/primitives";
import { DateBar } from "@/components/layout/DateBar";
import { ExerciseLogCard } from "./ExerciseLogCard";
import { AddExerciseDialog } from "./AddExerciseDialog";
import { useWorkoutDay } from "./useWorkout";
import { useSelectedDate } from "@/hooks/useSelectedDate";
import { SPLITS } from "@/constants/exercises";
import type { Split } from "@/types/database";

export function WorkoutPage() {
  const { date } = useSelectedDate();
  const day = useWorkoutDay(date);
  const [pickerOpen, setPickerOpen] = React.useState(false);

  const split = day.workout?.split ?? null;
  const added = new Set(day.logged.map((l) => l.exercise_id));

  const totalSets = day.logged.reduce(
    (n, l) => n + l.sets.filter((s) => s.completed).length, 0,
  );

  return (
    <div className="animate-fade-up">
      <DateBar title="Workout" />

      {/* Split is always a deliberate choice — never inferred from the weekday */}
      <Card>
        <CardBody>
          <p className="eyebrow mb-2.5">What are you training?</p>
          <Segmented
            value={split}
            onChange={(v) => day.startWorkout.mutate(v as Split)}
            options={SPLITS.map((s) => ({ value: s.value as Split, label: s.label, sublabel: s.blurb }))}
          />
        </CardBody>
      </Card>

      {!split ? (
        <div className="mt-3">
          <EmptyState icon={<Dumbbell className="h-6 w-6" />} title="No session started">
            Pick a split above when you get to the gym. Rest days need nothing here —
            leaving it blank is a valid answer.
          </EmptyState>
        </div>
      ) : day.isLoading ? (
        <div className="mt-3 space-y-3">
          {[0, 1].map((i) => <Skeleton key={i} className="h-64" />)}
        </div>
      ) : (
        <>
          <div className="mt-3 flex items-center justify-between px-1">
            <p className="text-[12px] text-muted">
              {day.logged.length} exercise{day.logged.length === 1 ? "" : "s"} · {totalSets} set
              {totalSets === 1 ? "" : "s"} done
            </p>
          </div>

          <div className="mt-2 space-y-3">
            {day.logged.map((logged) => (
              <ExerciseLogCard
                key={logged.id}
                logged={logged}
                date={date}
                onAddSet={(setNumber, seed) =>
                  day.addSet.mutate({
                    workoutExerciseId: logged.id,
                    setNumber,
                    unit: logged.exercise.unit,
                    seed,
                  })
                }
                onUpdateSet={(id, patch) => day.updateSet.mutate({ id, patch })}
                onRemoveSet={(id) => day.removeSet.mutate(id)}
                onRemove={() => day.removeExercise.mutate(logged.id)}
                onSaveNotes={(notes) => day.saveNotes.mutate({ workoutExerciseId: logged.id, notes })}
              />
            ))}

            {day.logged.length === 0 && (
              <EmptyState icon={<Dumbbell className="h-6 w-6" />} title="Empty session">
                Add the first lift and last week's numbers will show up next to it.
              </EmptyState>
            )}

            <Button variant="secondary" size="lg" className="w-full"
              onClick={() => setPickerOpen(true)}>
              <Plus className="h-4 w-4" /> Add exercise
            </Button>
          </div>

          <AddExerciseDialog
            open={pickerOpen}
            onOpenChange={setPickerOpen}
            split={split}
            alreadyAdded={added}
            onPick={(exerciseId) =>
              day.workout &&
              day.addExercise.mutate({
                workoutId: day.workout.id,
                exerciseId,
                sortOrder: day.logged.length,
              })
            }
          />
        </>
      )}
    </div>
  );
}
