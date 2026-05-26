"use client";

import { Dumbbell } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<CallbackStatus message="Confirmando cadastro..." />}>
      <AuthCallback />
    </Suspense>
  );
}

function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("Confirmando cadastro...");

  useEffect(() => {
    async function confirmEmail() {
      const code = searchParams.get("code");

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setMessage(error.message);
          return;
        }
      }

      router.replace("/");
    }

    confirmEmail();
  }, [router, searchParams]);

  return <CallbackStatus message={message} />;
}

function CallbackStatus({ message }: { message: string }) {
  return (
    <main className="grid min-h-screen place-items-center px-5">
      <div className="flex items-center gap-3 rounded-lg bg-white px-5 py-4 shadow-soft">
        <Dumbbell className="h-5 w-5 animate-pulse text-grass" />
        <span className="text-sm font-semibold">{message}</span>
      </div>
    </main>
  );
}
