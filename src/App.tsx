import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { AuthPage } from "@/features/auth/AuthPage";
import { useAuth } from "@/features/auth/AuthProvider";
import { PhaseProvider } from "@/features/plan/PhaseProvider";
import { DashboardPage } from "@/features/dashboard/DashboardPage";
import { FoodPage } from "@/features/food/FoodPage";
import { WorkoutPage } from "@/features/workout/WorkoutPage";
import { AnalyticsPage } from "@/features/workout/AnalyticsPage";
import { WeightPage } from "@/features/weight/WeightPage";
import { LearnPage } from "@/features/learn/LearnPage";
import { TrackerPage } from "@/features/tracker/TrackerPage";
import { SettingsPage } from "@/features/settings/SettingsPage";
import { Skeleton } from "@/components/ui/primitives";

export default function App() {
  const { session, loading } = useAuth();

  if (loading) return <BootScreen />;
  if (!session) return <AuthPage />;

  return (
    <PhaseProvider fallback={<BootScreen />}>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="food" element={<FoodPage />} />
          <Route path="workout" element={<WorkoutPage />} />
          <Route path="weight" element={<WeightPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="learn" element={<LearnPage />} />
          <Route path="tracker" element={<TrackerPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </PhaseProvider>
  );
}

function BootScreen() {
  return (
    <div className="mx-auto w-full max-w-[760px] space-y-3 px-4 py-8">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-52" />
      <div className="grid gap-3 sm:grid-cols-3">
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
      <Skeleton className="h-40" />
    </div>
  );
}
