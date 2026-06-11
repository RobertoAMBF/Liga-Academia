"use client";

import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import clsx from "clsx";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Copy,
  Dumbbell,
  Droplets,
  Download,
  FileText,
  LogOut,
  Plus,
  Trash2,
  Shield,
  Trophy,
  UserPlus,
  UsersRound,
  XCircle
} from "lucide-react";
import type { FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type League = {
  id: string;
  name: string;
  invite_code: string;
  created_at: string;
};

type Standing = {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  presences: number;
  absences: number;
  total_minutes: number;
  streak_bonus: number;
  hydration_points: number;
  points: number;
};

type Workout = {
  id: string;
  workout_date: string;
  status: "present" | "absent";
  minutes: number;
  points: number;
  muscle_group: MuscleGroup | null;
  muscles: string[];
  water_ml: number;
  water_goal_ml: number | null;
  water_points: number;
  created_at: string;
  league_id: string;
};

type MuscleGroup = "Superiores" | "Inferiores" | "Full Body";

type Profile = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  weight_kg: number | null;
  height_cm: number | null;
};

const today = new Date().toISOString().slice(0, 10);
const upperMuscles = ["Peito", "Bíceps", "Tríceps", "Costas", "Ombro"];
const lowerMuscles = ["Posterior de Perna", "Glúteos", "Quadríceps", "Panturrilha"];
const muscleOptionsByGroup: Record<MuscleGroup, string[]> = {
  Superiores: upperMuscles,
  Inferiores: lowerMuscles,
  "Full Body": [...upperMuscles, ...lowerMuscles]
};

function pointsFor(status: "present" | "absent", minutes: number) {
  if (status === "absent") return -1;
  if (minutes >= 120) return 5;
  if (minutes >= 60) return 4;
  if (minutes >= 30) return 3;
  return 0;
}

function waterGoalFor(weightKg: number | null, heightCm: number | null) {
  if (!weightKg || !heightCm) return null;
  const heightAdjustment = heightCm >= 180 ? 250 : heightCm <= 155 ? -150 : 0;
  return Math.max(1500, Math.round((weightKg * 35 + heightAdjustment) / 50) * 50);
}

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, nextSession) => {
      setSession(nextSession);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center px-5">
        <div className="flex items-center gap-3 rounded-lg bg-white px-5 py-4 shadow-soft">
          <Dumbbell className="h-5 w-5 animate-pulse text-grass" />
          <span className="text-sm font-semibold">Carregando sua liga...</span>
        </div>
      </main>
    );
  }

  return session?.user ? <Dashboard user={session.user} /> : <AuthScreen />;
}

function AuthScreen() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    const response =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { display_name: name || email.split("@")[0] },
              emailRedirectTo: `${window.location.origin}/auth/callback`
            }
          });

    if (response.error) {
      setMessage(response.error.message);
    } else if (mode === "signup") {
      setMessage("Cadastro criado. Confirme o e-mail se o Supabase solicitar.");
    }

    setBusy(false);
  }

  return (
    <main className="min-h-screen px-5 py-6 sm:px-8">
      <section className="mx-auto grid min-h-[calc(100vh-3rem)] w-full max-w-6xl items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-grass/20 bg-white/75 px-3 py-2 text-sm font-semibold text-grass">
            <Shield className="h-4 w-4" />
            Supabase Auth + ranking em tempo real
          </div>
          <div className="space-y-5">
            <h1 className="max-w-2xl text-5xl font-black leading-[0.96] tracking-normal text-ink sm:text-7xl">
              Liga da Academia
            </h1>
            <p className="max-w-xl text-lg leading-8 text-ink/72">
              Crie uma liga com seus amigos, registre presença ou falta no treino e acompanhe uma
              tabela estilo Brasileirão com pontuação automática.
            </p>
          </div>
          <div className="grid max-w-2xl grid-cols-3 gap-3">
            {[
              ["+3", "presença"],
              ["+5", "sequencia"],
              ["-1", "falta"]
            ].map(([value, label]) => (
              <div key={label} className="rounded-lg border border-white/80 bg-white/70 p-4 shadow-sm">
                <strong className="block text-2xl text-grass">{value}</strong>
                <span className="text-xs font-semibold uppercase tracking-wide text-ink/55">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={submit} className="rounded-lg bg-white p-5 shadow-soft sm:p-7">
          <div className="mb-6 grid grid-cols-2 gap-2 rounded-lg bg-mist p-1">
            <button
              className={clsx("rounded-md px-4 py-3 text-sm font-bold", mode === "login" && "bg-white shadow-sm")}
              type="button"
              onClick={() => setMode("login")}
            >
              Entrar
            </button>
            <button
              className={clsx("rounded-md px-4 py-3 text-sm font-bold", mode === "signup" && "bg-white shadow-sm")}
              type="button"
              onClick={() => setMode("signup")}
            >
              Cadastrar
            </button>
          </div>

          <div className="space-y-4">
            {mode === "signup" && (
              <label className="block">
                <span className="mb-2 block text-sm font-bold">Nome</span>
                <input
                  className="w-full rounded-lg border border-ink/15 px-4 py-3 outline-none focus:border-grass"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Seu nome na tabela"
                />
              </label>
            )}
            <label className="block">
              <span className="mb-2 block text-sm font-bold">E-mail</span>
              <input
                className="w-full rounded-lg border border-ink/15 px-4 py-3 outline-none focus:border-grass"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                placeholder="voce@email.com"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-bold">Senha</span>
              <input
                className="w-full rounded-lg border border-ink/15 px-4 py-3 outline-none focus:border-grass"
                type="password"
                minLength={6}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                placeholder="Minimo de 6 caracteres"
              />
            </label>
          </div>

          {message && <p className="mt-4 rounded-lg bg-mist p-3 text-sm font-semibold text-ink/75">{message}</p>}

          <button
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-grass px-5 py-3 font-black text-white shadow-sm transition hover:bg-ink disabled:cursor-not-allowed disabled:opacity-60"
            disabled={busy}
          >
            <Dumbbell className="h-5 w-5" />
            {busy ? "Aguarde..." : mode === "login" ? "Entrar na liga" : "Criar conta"}
          </button>
        </form>
      </section>
    </main>
  );
}

function Dashboard({ user }: { user: User }) {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [activeLeague, setActiveLeague] = useState<League | null>(null);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [history, setHistory] = useState<Workout[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [leagueName, setLeagueName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [workoutDate, setWorkoutDate] = useState(today);
  const [status, setStatus] = useState<"present" | "absent">("present");
  const [minutes, setMinutes] = useState(60);
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup>("Superiores");
  const [selectedMuscles, setSelectedMuscles] = useState<string[]>([]);
  const [weightKg, setWeightKg] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [waterMl, setWaterMl] = useState(2000);
  const [activeTab, setActiveTab] = useState<"league" | "training">("league");
  const [historyCollapsed, setHistoryCollapsed] = useState(false);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const displayName = user.user_metadata.display_name || user.email?.split("@")[0] || "Atleta";
  const previewPoints = useMemo(() => pointsFor(status, minutes), [minutes, status]);
  const waterGoalMl = useMemo(
    () => waterGoalFor(profile?.weight_kg ?? null, profile?.height_cm ?? null),
    [profile?.height_cm, profile?.weight_kg]
  );
  const waterPreviewPoints = waterGoalMl ? (waterMl >= waterGoalMl ? 1 : -1) : 0;
  const availableMuscles = muscleOptionsByGroup[muscleGroup];

  useEffect(() => {
    syncProfile();
    loadLeagues();
  }, []);

  useEffect(() => {
    if (activeLeague) {
      loadLeagueData(activeLeague.id);
    } else {
      setStandings([]);
      setHistory([]);
    }
  }, [activeLeague]);

  useEffect(() => {
    setSelectedMuscles((current) => current.filter((muscle) => availableMuscles.includes(muscle)));
  }, [availableMuscles]);

  async function syncProfile() {
    await supabase.from("profiles").upsert({
      id: user.id,
      display_name: displayName,
      avatar_url: user.user_metadata.avatar_url ?? null
    });

    const { data, error } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url, weight_kg, height_cm")
      .eq("id", user.id)
      .single();

    if (!error && data) {
      const nextProfile = data as Profile;
      setProfile(nextProfile);
      setWeightKg(nextProfile.weight_kg ? String(nextProfile.weight_kg) : "");
      setHeightCm(nextProfile.height_cm ? String(nextProfile.height_cm) : "");
      const nextGoal = waterGoalFor(nextProfile.weight_kg, nextProfile.height_cm);
      if (nextGoal) setWaterMl(nextGoal);
    }
  }

  async function loadLeagues() {
    const { data, error } = await supabase
      .from("league_members")
      .select("leagues(id, name, invite_code, created_at)")
      .eq("user_id", user.id)
      .order("joined_at", { ascending: false });

    if (error) {
      setNotice(error.message);
      return;
    }

    const nextLeagues = (data ?? []).map((item) => item.leagues).filter(Boolean) as unknown as League[];
    setLeagues(nextLeagues);
    setActiveLeague((current) => nextLeagues.find((league) => league.id === current?.id) ?? nextLeagues[0] ?? null);
  }

  async function loadLeagueData(leagueId: string) {
    const historySince = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const [standingResponse, historyResponse] = await Promise.all([
      supabase.rpc("get_league_standings", { p_league_id: leagueId }),
      supabase
        .from("workouts")
        .select("id, workout_date, status, minutes, points, muscle_group, muscles, water_ml, water_goal_ml, water_points, created_at, league_id")
        .eq("league_id", leagueId)
        .eq("user_id", user.id)
        .gte("created_at", historySince)
        .order("workout_date", { ascending: false })
        .limit(30)
    ]);

    if (standingResponse.error) setNotice(standingResponse.error.message);
    else setStandings((standingResponse.data ?? []) as Standing[]);

    if (historyResponse.error) setNotice(historyResponse.error.message);
    else setHistory((historyResponse.data ?? []) as Workout[]);
  }

  async function createLeague(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setNotice("");
    const { data, error } = await supabase.rpc("create_league", { p_name: leagueName.trim() });

    if (error) setNotice(error.message);
    else {
      setLeagueName("");
      await loadLeagues();
      setActiveLeague(data?.[0] as League);
      setNotice("Liga criada com sucesso.");
    }
    setBusy(false);
  }

  async function joinLeague(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setNotice("");
    const { error } = await supabase.rpc("join_league_by_code", { p_invite_code: inviteCode.trim().toUpperCase() });

    if (error) setNotice(error.message);
    else {
      setInviteCode("");
      await loadLeagues();
      setNotice("Você entrou na liga.");
    }
    setBusy(false);
  }

  async function leaveLeague(league: League) {
    const confirmed = window.confirm(`Sair da liga ${league.name}?`);
    if (!confirmed) return;

    setBusy(true);
    setNotice("");

    const { error } = await supabase.rpc("leave_league", { p_league_id: league.id });

    if (error) setNotice(error.message);
    else {
      setNotice(`Você saiu da liga ${league.name}.`);
      await loadLeagues();
    }

    setBusy(false);
  }

  async function saveWorkout(event: FormEvent) {
    event.preventDefault();
    if (!activeLeague) return;
    if (status === "present" && minutes < 30) {
      setNotice("Treino com presença precisa ter pelo menos 30 minutos.");
      return;
    }
    setBusy(true);
    setNotice("");

    const { error } = await supabase.from("workouts").upsert(
      {
        league_id: activeLeague.id,
        user_id: user.id,
        workout_date: workoutDate,
        status,
        minutes: status === "present" ? minutes : 0,
        muscle_group: status === "present" ? muscleGroup : null,
        muscles: status === "present" ? selectedMuscles : [],
        water_ml: waterMl,
        water_goal_ml: waterGoalMl,
        points: previewPoints
      },
      { onConflict: "league_id,user_id,workout_date" }
    );

    if (error) setNotice(error.message);
    else {
      setNotice("Treino registrado.");
      await loadLeagueData(activeLeague.id);
    }
    setBusy(false);
  }

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setNotice("");

    const nextWeight = weightKg.trim() ? Number(weightKg.replace(",", ".")) : null;
    const nextHeight = heightCm.trim() ? Number(heightCm) : null;

    const { data, error } = await supabase
      .from("profiles")
      .update({
        weight_kg: nextWeight !== null && Number.isFinite(nextWeight) ? nextWeight : null,
        height_cm: nextHeight !== null && Number.isFinite(nextHeight) ? nextHeight : null
      })
      .eq("id", user.id)
      .select("id, display_name, avatar_url, weight_kg, height_cm")
      .single();

    if (error) setNotice(error.message);
    else {
      const nextProfile = data as Profile;
      const nextGoal = waterGoalFor(nextProfile.weight_kg, nextProfile.height_cm);
      setProfile(nextProfile);
      if (nextGoal) setWaterMl(nextGoal);
      setNotice("Perfil atualizado.");
    }

    setBusy(false);
  }

  async function deleteWorkout(workoutId: string) {
    if (!activeLeague) return;
    const confirmed = window.confirm("Excluir este registro de treino?");
    if (!confirmed) return;

    setBusy(true);
    setNotice("");
    const { error } = await supabase.from("workouts").delete().eq("id", workoutId).eq("user_id", user.id);

    if (error) setNotice(error.message);
    else {
      setNotice("Registro excluído.");
      await loadLeagueData(activeLeague.id);
    }

    setBusy(false);
  }

  async function copyInvite() {
    if (!activeLeague) return;
    await navigator.clipboard.writeText(activeLeague.invite_code);
    setNotice("Código copiado.");
  }

  function toggleMuscle(muscle: string) {
    setSelectedMuscles((current) =>
      current.includes(muscle) ? current.filter((item) => item !== muscle) : [...current, muscle]
    );
  }

  function muscleSummary(workout: Workout) {
    if (workout.status !== "present") return "Não informado";
    if (workout.muscles.length === 0) return workout.muscle_group ?? "Não informado";
    return `${workout.muscle_group ?? "Grupo"}: ${workout.muscles.join(", ")}`;
  }

  function downloadFile(content: string, fileName: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  }

  function exportHistory(format: "csv" | "txt") {
    if (history.length === 0) {
      setNotice("Não há histórico recente para exportar.");
      return;
    }

    if (format === "csv") {
      const headers = [
        "Data",
        "Status",
        "Minutos",
        "Pontos treino",
        "Água ml",
        "Pontos água",
        "Grupo muscular",
        "Músculos treinados"
      ];
      const rows = history.map((item) => [
        new Date(`${item.workout_date}T12:00:00`).toLocaleDateString("pt-BR"),
        item.status === "present" ? "Presença" : "Falta",
        String(item.minutes),
        String(item.points),
        String(item.water_ml),
        String(item.water_points),
        item.muscle_group ?? "",
        item.muscles.join(", ")
      ]);
      const escapeCsv = (value: string) => `"${value.replaceAll('"', '""')}"`;
      const content = [headers, ...rows].map((row) => row.map(escapeCsv).join(";")).join("\n");
      downloadFile(content, "historico-treinos.csv", "text/csv;charset=utf-8");
      return;
    }

    const content = history
      .map((item) =>
        [
          `Data: ${new Date(`${item.workout_date}T12:00:00`).toLocaleDateString("pt-BR")}`,
          `Status: ${item.status === "present" ? "Presença" : "Falta"}`,
          `Tempo: ${item.minutes} min`,
          `Pontos treino: ${item.points}`,
          `Água: ${item.water_ml} ml (${item.water_points > 0 ? "+" : ""}${item.water_points} pt)`,
          `Treinado: ${muscleSummary(item)}`
        ].join("\n")
      )
      .join("\n\n---\n\n");

    downloadFile(content, "historico-treinos.txt", "text/plain;charset=utf-8");
  }

  return (
    <main className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-grass">
              <Dumbbell className="h-5 w-5" />
              Liga da Academia
            </div>
            <h1 className="mt-2 text-4xl font-black leading-none tracking-normal text-ink sm:text-6xl">
              Olá, {displayName}
            </h1>
          </div>
          <button
            onClick={() => supabase.auth.signOut()}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-ink/10 bg-white px-4 py-3 text-sm font-bold shadow-sm transition hover:-translate-y-0.5 hover:border-grass/35 hover:shadow-soft"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </header>

        {notice && (
          <div className="mb-5 rounded-lg border border-grass/20 bg-white px-4 py-3 text-sm font-bold shadow-sm">
            {notice}
          </div>
        )}

        <div className="mb-5 grid grid-cols-2 gap-2 rounded-lg bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setActiveTab("league")}
            className={clsx(
              "inline-flex items-center justify-center gap-2 rounded-md px-4 py-3 text-sm font-black transition",
              activeTab === "league" ? "bg-ink text-white shadow-sm" : "text-ink/65 hover:bg-mist"
            )}
          >
            <Trophy className="h-4 w-4" />
            Liga
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("training")}
            className={clsx(
              "inline-flex items-center justify-center gap-2 rounded-md px-4 py-3 text-sm font-black transition",
              activeTab === "training" ? "bg-ink text-white shadow-sm" : "text-ink/65 hover:bg-mist"
            )}
          >
            <Dumbbell className="h-4 w-4" />
            Treinos
          </button>
        </div>

        <section className="grid gap-5 lg:grid-cols-[1fr_330px]">
          <aside className="order-2 space-y-5 lg:order-2">
            {activeTab === "league" ? (
              <>
                <Panel title="Minhas Ligas" icon={<UsersRound className="h-5 w-5" />}>
                  <div className="space-y-2">
                    {leagues.length === 0 && <p className="text-sm text-ink/60">Crie ou entre em uma liga para começar.</p>}
                    {leagues.map((league) => (
                      <div
                        key={league.id}
                        className={clsx(
                          "grid grid-cols-[1fr_auto] items-center gap-2 rounded-lg border p-2 transition hover:-translate-y-0.5 hover:shadow-sm",
                          activeLeague?.id === league.id
                            ? "border-grass bg-mist text-grass shadow-sm"
                            : "border-ink/10 bg-white hover:border-grass/35"
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => setActiveLeague(league)}
                          className="flex min-w-0 items-center justify-between gap-2 rounded-md px-1 py-1 text-left font-bold"
                        >
                          <span className="truncate">{league.name}</span>
                          <span className="rounded-full bg-white px-2 py-1 text-xs text-ink/65">{league.invite_code}</span>
                        </button>
                        <button
                          type="button"
                          aria-label={`Sair da liga ${league.name}`}
                          onClick={() => leaveLeague(league)}
                          className="rounded-md bg-white p-2 text-clay shadow-sm transition hover:bg-clay hover:text-white disabled:opacity-50"
                          disabled={busy}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </Panel>

                <Panel title="Criar Liga" icon={<Plus className="h-5 w-5" />}>
                  <form onSubmit={createLeague} className="space-y-3">
                    <input
                      className="w-full rounded-lg border border-ink/15 px-3 py-3 outline-none focus:border-grass"
                      value={leagueName}
                      onChange={(event) => setLeagueName(event.target.value)}
                      required
                      placeholder="Nome da liga"
                    />
                    <button className="w-full rounded-lg bg-ink px-4 py-3 text-sm font-black text-white" disabled={busy}>
                      Criar
                    </button>
                  </form>
                </Panel>

                <Panel title="Entrar por Código" icon={<UserPlus className="h-5 w-5" />}>
                  <form onSubmit={joinLeague} className="space-y-3">
                    <input
                      className="w-full rounded-lg border border-ink/15 px-3 py-3 uppercase outline-none focus:border-grass"
                      value={inviteCode}
                      onChange={(event) => setInviteCode(event.target.value)}
                      required
                      placeholder="ABC123"
                    />
                    <button className="w-full rounded-lg bg-grass px-4 py-3 text-sm font-black text-white" disabled={busy}>
                      Entrar
                    </button>
                  </form>
                </Panel>
              </>
            ) : (
              <Panel title="Perfil e Água" icon={<Droplets className="h-5 w-5" />}>
                <form onSubmit={saveProfile} className="space-y-3">
                  <label className="block">
                    <span className="mb-2 block text-sm font-bold">Peso em kg</span>
                    <input
                      className="w-full rounded-lg border border-ink/15 px-3 py-3 outline-none focus:border-grass"
                      inputMode="decimal"
                      value={weightKg}
                      onChange={(event) => setWeightKg(event.target.value)}
                      placeholder="Ex: 78"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-bold">Altura em cm</span>
                    <input
                      className="w-full rounded-lg border border-ink/15 px-3 py-3 outline-none focus:border-grass"
                      inputMode="numeric"
                      value={heightCm}
                      onChange={(event) => setHeightCm(event.target.value)}
                      placeholder="Ex: 175"
                    />
                  </label>
                  <div className="rounded-lg bg-mist p-3 text-sm font-bold text-ink/70">
                    Meta Diária: {waterGoalMl ? `${waterGoalMl} ml (${(waterGoalMl / 1000).toFixed(2)} L)` : "preencha peso e altura"}
                  </div>
                  <button className="w-full rounded-lg bg-ink px-4 py-3 text-sm font-black text-white" disabled={busy}>
                    Salvar perfil
                  </button>
                </form>
              </Panel>
            )}
          </aside>

          <div className="order-1 space-y-5 lg:order-1">
            {activeTab === "league" ? (
              <>
            <section className="overflow-hidden rounded-lg bg-ink text-white shadow-soft">
              <div className="grid gap-5 p-5 sm:grid-cols-[1fr_auto] sm:items-center sm:p-6">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-lime">Liga Ativa</p>
                  <h2 className="mt-2 text-4xl font-black leading-none">{activeLeague?.name ?? "Nenhuma liga"}</h2>
                </div>
                {activeLeague && (
                  <button
                    onClick={copyInvite}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-3 text-sm font-black text-ink shadow-sm transition hover:-translate-y-0.5 hover:bg-lime"
                  >
                    <Copy className="h-4 w-4" />
                    {activeLeague.invite_code}
                  </button>
                )}
              </div>
              <div className="grid grid-cols-3 border-t border-white/10 bg-white/5 text-center">
                <ScoreHint value="+3" label="30 min" />
                <ScoreHint value="+4" label="60 min" />
                <ScoreHint value="+5" label="120 min" />
              </div>
            </section>

            <Panel title="Classificação" icon={<Trophy className="h-5 w-5" />} featured>
              <div className="mb-4 max-w-48">
                <LeagueStat label="Atletas" value={standings.length} />
              </div>
              <div className="overflow-x-auto rounded-lg border border-ink/10">
                <table className="w-full min-w-[740px] border-collapse text-sm">
                  <thead className="bg-ink text-left text-[11px] uppercase tracking-wide text-white/70">
                    <tr>
                      <th className="px-4 py-3">Pos</th>
                      <th className="py-3">Atleta</th>
                      <th className="text-center">Pts</th>
                      <th className="text-center">Pres</th>
                      <th className="text-center">Faltas</th>
                      <th className="text-center">Min</th>
                      <th className="text-center">Agua</th>
                      <th className="pr-4 text-center">Seq</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink/10 bg-white">
                    {standings.map((row, index) => (
                      <tr key={row.user_id} className="transition hover:bg-mist/80">
                        <td className="px-4 py-4">
                          <span
                            className={clsx(
                              "inline-grid h-9 w-9 place-items-center rounded-lg text-sm font-black",
                              index === 0 ? "bg-lime text-ink" : "bg-mist text-ink/70"
                            )}
                          >
                            {index + 1}
                          </span>
                        </td>
                        <td className="py-4">
                          <div className="font-black text-ink">{row.display_name}</div>
                          <div className="text-xs font-bold text-ink/45">
                            {row.presences + row.absences} registros
                          </div>
                        </td>
                        <td className="text-center">
                          <span className="inline-flex min-w-14 justify-center rounded-full bg-grass px-3 py-1 text-base font-black text-white">
                            {row.points}
                          </span>
                        </td>
                        <td className="text-center font-black text-grass">{row.presences}</td>
                        <td className="text-center font-black text-clay">{row.absences}</td>
                        <td className="text-center font-bold text-ink/70">{row.total_minutes}</td>
                        <td className="text-center font-bold text-ink/70">
                          {row.hydration_points > 0 ? `+${row.hydration_points}` : row.hydration_points}
                        </td>
                        <td className="pr-4 text-center font-black text-ink/70">+{row.streak_bonus}</td>
                      </tr>
                    ))}
                    {standings.length === 0 && (
                      <tr>
                        <td className="py-10 text-center text-ink/55" colSpan={8}>
                          Sem treinos registrados nesta liga.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Panel>
              </>
            ) : (
              <>
            <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
              <Panel title="Registrar Treino" icon={<CalendarDays className="h-5 w-5" />}>
                <form onSubmit={saveWorkout} className="grid gap-4">
                  <label>
                    <span className="mb-2 block text-sm font-bold">Data</span>
                    <input
                      className="w-full rounded-lg border border-ink/15 px-3 py-3 outline-none focus:border-grass"
                      type="date"
                      value={workoutDate}
                      onChange={(event) => setWorkoutDate(event.target.value)}
                    />
                  </label>

                  <div className="grid grid-cols-2 gap-2 rounded-lg bg-mist p-1">
                    <button
                      type="button"
                      onClick={() => setStatus("present")}
                      className={clsx("inline-flex items-center justify-center gap-2 rounded-md py-3 text-sm font-black", status === "present" && "bg-white shadow-sm")}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Presença
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatus("absent")}
                      className={clsx("inline-flex items-center justify-center gap-2 rounded-md py-3 text-sm font-black", status === "absent" && "bg-white shadow-sm")}
                    >
                      <XCircle className="h-4 w-4" />
                      Falta
                    </button>
                  </div>

                  <label className={clsx(status === "absent" && "opacity-45")}>
                    <span className="mb-2 flex items-center gap-2 text-sm font-bold">
                      <Clock3 className="h-4 w-4" />
                      Tempo de Treino
                    </span>
                    <input
                      className="w-full accent-grass"
                      type="range"
                      min={30}
                      max={180}
                      step={15}
                      value={minutes}
                      disabled={status === "absent"}
                      onChange={(event) => setMinutes(Number(event.target.value))}
                    />
                    <div className="mt-2 flex items-center justify-between text-sm font-bold text-ink/65">
                      <span>{status === "present" ? `${minutes} min` : "0 min"}</span>
                      <span>{previewPoints > 0 ? `+${previewPoints}` : previewPoints} pts</span>
                    </div>
                  </label>

                  <fieldset
                    className={clsx(
                      "rounded-lg border border-ink/10 bg-mist p-3",
                      status === "absent" && "pointer-events-none opacity-45"
                    )}
                    disabled={status === "absent"}
                  >
                    <legend className="px-1 text-sm font-black">Grupo Muscular Treinado</legend>
                    <div className="mt-3 grid grid-cols-3 gap-2 rounded-lg bg-white p-1">
                      {(["Superiores", "Inferiores", "Full Body"] as MuscleGroup[]).map((group) => (
                        <button
                          key={group}
                          type="button"
                          onClick={() => setMuscleGroup(group)}
                          className={clsx(
                            "rounded-md px-2 py-2 text-xs font-black transition",
                            muscleGroup === group ? "bg-ink text-white shadow-sm" : "text-ink/65 hover:bg-mist"
                          )}
                        >
                          {group}
                        </button>
                      ))}
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {availableMuscles.map((muscle) => (
                        <label
                          key={muscle}
                          className={clsx(
                            "flex items-center gap-2 rounded-md border bg-white px-3 py-2 text-sm font-bold transition",
                            selectedMuscles.includes(muscle) ? "border-grass text-grass shadow-sm" : "border-ink/10 text-ink/70"
                          )}
                        >
                          <input
                            type="checkbox"
                            className="accent-grass"
                            checked={selectedMuscles.includes(muscle)}
                            onChange={() => toggleMuscle(muscle)}
                          />
                          {muscle}
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  <label>
                    <span className="mb-2 flex items-center gap-2 text-sm font-bold">
                      <Droplets className="h-4 w-4" />
                      Água Tomada
                    </span>
                    <input
                      className="w-full accent-grass"
                      type="range"
                      min={0}
                      max={5000}
                      step={100}
                      value={waterMl}
                      onChange={(event) => setWaterMl(Number(event.target.value))}
                    />
                    <div className="mt-2 flex items-center justify-between text-sm font-bold text-ink/65">
                      <span>{waterMl} ml ({(waterMl / 1000).toFixed(1)} L)</span>
                      <span>{waterGoalMl ? `${waterPreviewPoints > 0 ? "+" : ""}${waterPreviewPoints} pt` : "sem meta"}</span>
                    </div>
                  </label>

                  <button
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-grass px-4 py-3 font-black text-white disabled:opacity-60"
                    disabled={busy || !activeLeague}
                  >
                    <Dumbbell className="h-5 w-5" />
                    Salvar treino
                  </button>
                </form>
              </Panel>
            </div>

            <Panel title="Histórico de Treinos" icon={<Clock3 className="h-5 w-5" />}>
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-bold text-ink/55">Registros recentes das últimas 24 horas.</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => exportHistory("csv")}
                    className="inline-flex items-center gap-2 rounded-md border border-ink/10 bg-white px-3 py-2 text-xs font-black text-ink transition hover:border-grass hover:text-grass"
                  >
                    <Download className="h-4 w-4" />
                    CSV
                  </button>
                  <button
                    type="button"
                    onClick={() => exportHistory("txt")}
                    className="inline-flex items-center gap-2 rounded-md border border-ink/10 bg-white px-3 py-2 text-xs font-black text-ink transition hover:border-grass hover:text-grass"
                  >
                    <FileText className="h-4 w-4" />
                    TXT
                  </button>
                  <button
                    type="button"
                    onClick={() => setHistoryCollapsed((current) => !current)}
                    className="rounded-md bg-ink px-3 py-2 text-xs font-black text-white transition hover:bg-grass"
                  >
                    {historyCollapsed ? "Expandir" : "Minimizar"}
                  </button>
                </div>
              </div>

              {!historyCollapsed && (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg border border-ink/10 bg-mist p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-grass/30 hover:bg-white hover:shadow-soft"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[11px] font-black uppercase tracking-wide text-ink/45">Rodada</span>
                        <strong className="block text-lg text-ink">
                          {new Date(`${item.workout_date}T12:00:00`).toLocaleDateString("pt-BR")}
                        </strong>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={clsx("rounded-full px-2.5 py-1 text-xs font-black", item.status === "present" ? "bg-grass text-white" : "bg-clay text-white")}>
                          {item.status === "present" ? "Presença" : "Falta"}
                        </span>
                        <button
                          type="button"
                          aria-label="Excluir treino"
                          onClick={() => deleteWorkout(item.id)}
                          className="rounded-md bg-white p-2 text-clay shadow-sm transition hover:bg-clay hover:text-white"
                          disabled={busy}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                      <RoundStat label="Treino" value={`${item.minutes} min`} />
                      <RoundStat label="Pontos" value={`${item.points > 0 ? "+" : ""}${item.points}`} />
                      <RoundStat label="Água" value={`${item.water_points > 0 ? "+" : ""}${item.water_points}`} />
                    </div>
                    <div className="mt-3 rounded-md bg-white/70 px-3 py-2 text-sm font-bold text-ink/60">
                      {item.water_ml} ml de água
                    </div>
                    <div className="mt-2 rounded-md bg-white/70 px-3 py-2 text-sm font-bold text-ink/70">
                      Treinado: {muscleSummary(item)}
                    </div>
                  </div>
                ))}
                {history.length === 0 && <p className="text-sm text-ink/55">Seu histórico aparece aqui depois do primeiro registro.</p>}
              </div>
              )}
            </Panel>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function Panel({
  title,
  icon,
  children,
  featured = false
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  featured?: boolean;
}) {
  return (
    <section
      className={clsx(
        "rounded-lg border border-white/80 bg-white p-4 shadow-sm sm:p-5",
        featured && "shadow-soft"
      )}
    >
      <h2 className={clsx("mb-4 flex items-center gap-2 font-black", featured ? "text-2xl" : "text-lg")}>
        <span className="text-grass">{icon}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function ScoreHint({ value, label }: { value: string; label: string }) {
  return (
    <div className="px-3 py-4">
      <strong className="block text-xl font-black text-lime">{value}</strong>
      <span className="text-[11px] font-black uppercase tracking-wide text-white/55">{label}</span>
    </div>
  );
}

function LeagueStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-ink/10 bg-mist px-4 py-3">
      <strong className="block text-2xl font-black text-ink">{value}</strong>
      <span className="text-[11px] font-black uppercase tracking-wide text-ink/45">{label}</span>
    </div>
  );
}

function RoundStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-white px-2 py-2">
      <strong className="block text-sm font-black text-ink">{value}</strong>
      <span className="text-[10px] font-black uppercase tracking-wide text-ink/40">{label}</span>
    </div>
  );
}
