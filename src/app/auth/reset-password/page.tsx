"use client";

import Link from "next/link";
import { KeyRound } from "lucide-react";
import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const initialization = useRef<Promise<void> | null>(null);

  useEffect(() => {
    // Reuse initialization so React Strict Mode cannot exchange the same code twice.
    if (!initialization.current) {
      initialization.current = (async () => {
        try {
          const url = new URL(window.location.href);
          const fragment = new URLSearchParams(url.hash.slice(1));
          if (url.searchParams.has("error") || fragment.has("error")) {
            setMessage("O link e invalido ou expirou. Solicite um novo link na tela de login.");
            return;
          }
          const code = url.searchParams.get("code");
          if (code) {
            const { error } = await supabase.auth.exchangeCodeForSession(code);
            if (error) {
              setMessage("Nao foi possivel validar o link. Solicite um novo link na tela de login.");
              return;
            }
          }
          // getSession waits for the client to consume an implicit recovery URL.
          const { data, error } = await supabase.auth.getSession();
          if (error || !data.session) {
            setMessage("Abra o link recebido por e-mail. Se ele expirou, solicite outro na tela de login.");
            return;
          }
          setReady(true);
          window.history.replaceState(null, "", url.pathname);
        } catch {
          setMessage("Nao foi possivel validar o link. Confira sua conexao e tente novamente.");
        } finally {
          setLoading(false);
        }
      })();
    }
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!ready || busy) return;
    if (password.length < 6) {
      setMessage("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirmation) {
      setMessage("As senhas nao coincidem.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) setMessage(error.message);
      else {
        setDone(true);
        setPassword("");
        setConfirmation("");
        setMessage("Senha atualizada com sucesso.");
      }
    } catch {
      setMessage("Nao foi possivel atualizar a senha. Confira sua conexao e tente novamente.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center px-4 py-8">
      <section className="w-full max-w-md rounded-lg bg-white p-6 shadow-soft">
        <h1 className="mb-6 flex items-center gap-2 text-2xl font-black">
          <KeyRound className="h-6 w-6 shrink-0 text-grass" /> Nova senha
        </h1>
        {loading && <p role="status">Validando link...</p>}
        {message && <p role="status" className="mb-4 rounded-lg bg-mist p-3 text-sm font-semibold">{message}</p>}
        {ready && !done && (
          <form onSubmit={submit} className="space-y-4">
            <label className="block text-sm font-bold">
              Nova senha
              <input type="password" autoComplete="new-password" required minLength={6}
                value={password} onChange={(event) => setPassword(event.target.value)}
                className="mt-2 w-full rounded-lg border border-ink/15 px-3 py-3 outline-none focus:border-grass" />
            </label>
            <label className="block text-sm font-bold">
              Confirmar nova senha
              <input type="password" autoComplete="new-password" required minLength={6}
                value={confirmation} onChange={(event) => setConfirmation(event.target.value)}
                className="mt-2 w-full rounded-lg border border-ink/15 px-3 py-3 outline-none focus:border-grass" />
            </label>
            <button disabled={busy} className="w-full rounded-lg bg-grass px-4 py-3 font-black text-solid transition hover:bg-strong disabled:opacity-60">
              {busy ? "Salvando..." : "Salvar nova senha"}
            </button>
          </form>
        )}
        <Link href="/" className="mt-5 inline-block text-sm font-bold text-grass hover:underline">
          {done ? "Continuar para o aplicativo" : "Voltar para o aplicativo"}
        </Link>
      </section>
    </main>
  );
}
