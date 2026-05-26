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
  water_ml: number;
  water_goal_ml: number | null;
  water_points: number;
  created_at: string;
  league_id: string;
};

type Profile = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  weight_kg: number | null;
  height_cm: number | null;
};

const today = new Date().toISOString().slice(0, 10);

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
              ["+3", "presenca"],
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
  const [weightKg, setWeightKg] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [waterMl, setWaterMl] = useState(2000);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const displayName = user.user_metadata.display_name || user.email?.split("@")[0] || "Atleta";
  const previewPoints = useMemo(() => pointsFor(status, minutes), [minutes, status]);
  const waterGoalMl = useMemo(
    () => waterGoalFor(profile?.weight_kg ?? null, profile?.height_cm ?? null),
    [profile?.height_cm, profile?.weight_kg]
  );
  const waterPreviewPoints = waterGoalMl ? (waterMl >= waterGoalMl ? 1 : -1) : 0;

  useEffect(() => {
    syncProfile();
    loadLeagues();
  }, []);

  useEffect(() => {
    if (activeLeague) {
      loadLeagueData(activeLeague.id);
    }
  }, [activeLeague]);

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
    setActiveLeague((current) => current ?? nextLeagues[0] ?? null);
  }

  async function loadLeagueData(leagueId: string) {
    const [standingResponse, historyResponse] = await Promise.all([
      supabase.rpc("get_league_standings", { p_league_id: leagueId }),
      supabase
        .from("workouts")
        .select("id, workout_date, status, minutes, points, water_ml, water_goal_ml, water_points, created_at, league_id")
        .eq("league_id", leagueId)
        .eq("user_id", user.id)
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
      setNotice("Voce entrou na liga.");
    }
    setBusy(false);
  }

  async function saveWorkout(event: FormEvent) {
    event.preventDefault();
    if (!activeLeague) return;
    if (status === "present" && minutes < 30) {
      setNotice("Treino com presenca precisa ter pelo menos 30 minutos.");
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
      setNotice("Registro excluido.");
      await loadLeagueData(activeLeague.id);
    }

    setBusy(false);
  }

  async function copyInvite() {
    if (!activeLeague) return;
    await navigator.clipboard.writeText(activeLeague.invite_code);
    setNotice("Codigo copiado.");
  }

  return (
    <main className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-grass">
              <Dumbbell className="h-5 w-5" />
              Liga da Academia
            </div>
            <h1 className="mt-2 text-3xl font-black tracking-normal sm:text-5xl">Ola, {displayName}</h1>
          </div>
          <button
            onClick={() => supabase.auth.signOut()}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-ink/10 bg-white px-4 py-3 text-sm font-bold shadow-sm"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </header>

        {notice && <div className="mb-5 rounded-lg border border-grass/20 bg-white px-4 py-3 text-sm font-bold">{notice}</div>}

        <section className="grid gap-5 lg:grid-cols-[320px_1fr]">
          <aside className="space-y-5">
            <Panel title="Minhas ligas" icon={<UsersRound className="h-5 w-5" />}>
              <div className="space-y-2">
                {leagues.length === 0 && <p className="text-sm text-ink/60">Crie ou entre em uma liga para comecar.</p>}
                {leagues.map((league) => (
                  <button
                    key={league.id}
                    onClick={() => setActiveLeague(league)}
                    className={clsx(
                      "flex w-full items-center justify-between rounded-lg border px-3 py-3 text-left font-bold",
                      activeLeague?.id === league.id ? "border-grass bg-mist text-grass" : "border-ink/10 bg-white"
                    )}
                  >
                    <span>{league.name}</span>
                    <span className="text-xs">{league.invite_code}</span>
                  </button>
                ))}
              </div>
            </Panel>

            <Panel title="Criar liga" icon={<Plus className="h-5 w-5" />}>
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

            <Panel title="Entrar por codigo" icon={<UserPlus className="h-5 w-5" />}>
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

            <Panel title="Perfil e agua" icon={<Droplets className="h-5 w-5" />}>
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
                  Meta diaria: {waterGoalMl ? `${waterGoalMl} ml (${(waterGoalMl / 1000).toFixed(2)} L)` : "preencha peso e altura"}
                </div>
                <button className="w-full rounded-lg bg-ink px-4 py-3 text-sm font-black text-white" disabled={busy}>
                  Salvar perfil
                </button>
              </form>
            </Panel>
          </aside>

          <div className="space-y-5">
            <section className="rounded-lg bg-ink p-5 text-white shadow-soft">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-bold uppercase tracking-wide text-lime">Liga ativa</p>
                  <h2 className="mt-1 text-3xl font-black">{activeLeague?.name ?? "Nenhuma liga"}</h2>
                </div>
                {activeLeague && (
                  <button
                    onClick={copyInvite}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-3 text-sm font-black text-ink"
                  >
                    <Copy className="h-4 w-4" />
                    {activeLeague.invite_code}
                  </button>
                )}
              </div>
            </section>

            <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
              <Panel title="Registrar treino" icon={<CalendarDays className="h-5 w-5" />}>
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
                      Presenca
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
                      Tempo de treino
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

                  <label>
                    <span className="mb-2 flex items-center gap-2 text-sm font-bold">
                      <Droplets className="h-4 w-4" />
                      Agua tomada
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

              <Panel title="Classificacao" icon={<Trophy className="h-5 w-5" />}>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[620px] border-separate border-spacing-y-2 text-sm">
                    <thead className="text-left text-xs uppercase tracking-wide text-ink/50">
                      <tr>
                        <th className="px-3">#</th>
                        <th>Atleta</th>
                        <th className="text-center">P</th>
                        <th className="text-center">Pres</th>
                        <th className="text-center">Faltas</th>
                        <th className="text-center">Min</th>
                        <th className="text-center">Agua</th>
                        <th className="text-center">Seq</th>
                      </tr>
                    </thead>
                    <tbody>
                      {standings.map((row, index) => (
                        <tr key={row.user_id} className="bg-mist">
                          <td className="rounded-l-lg px-3 py-3 font-black">{index + 1}</td>
                          <td className="py-3 font-black">{row.display_name}</td>
                          <td className="text-center text-lg font-black text-grass">{row.points}</td>
                          <td className="text-center font-bold">{row.presences}</td>
                          <td className="text-center font-bold">{row.absences}</td>
                          <td className="text-center font-bold">{row.total_minutes}</td>
                          <td className="text-center font-bold">{row.hydration_points > 0 ? `+${row.hydration_points}` : row.hydration_points}</td>
                          <td className="rounded-r-lg text-center font-bold">+{row.streak_bonus}</td>
                        </tr>
                      ))}
                      {standings.length === 0 && (
                        <tr>
                          <td className="py-6 text-center text-ink/55" colSpan={8}>
                            Sem treinos registrados nesta liga.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Panel>
            </div>

            <Panel title="Historico de treinos" icon={<Clock3 className="h-5 w-5" />}>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {history.map((item) => (
                  <div key={item.id} className="rounded-lg border border-ink/10 bg-mist p-4">
                    <div className="flex items-center justify-between gap-3">
                      <strong>{new Date(`${item.workout_date}T12:00:00`).toLocaleDateString("pt-BR")}</strong>
                      <div className="flex items-center gap-2">
                        <span className={clsx("rounded-full px-2 py-1 text-xs font-black", item.status === "present" ? "bg-grass text-white" : "bg-clay text-white")}>
                          {item.status === "present" ? "Presenca" : "Falta"}
                        </span>
                        <button
                          type="button"
                          aria-label="Excluir treino"
                          onClick={() => deleteWorkout(item.id)}
                          className="rounded-md bg-white p-2 text-clay shadow-sm"
                          disabled={busy}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-sm font-bold text-ink/65">
                      <span>{item.minutes} min</span>
                      <span>{item.points > 0 ? `+${item.points}` : item.points} pts</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-sm font-bold text-ink/65">
                      <span>{item.water_ml} ml de agua</span>
                      <span>{item.water_points > 0 ? `+${item.water_points}` : item.water_points} pt</span>
                    </div>
                  </div>
                ))}
                {history.length === 0 && <p className="text-sm text-ink/55">Seu historico aparece aqui depois do primeiro registro.</p>}
              </div>
            </Panel>
          </div>
        </section>
      </div>
    </main>
  );
}

function Panel({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-white/80 bg-white p-4 shadow-sm sm:p-5">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-black">
        <span className="text-grass">{icon}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}
