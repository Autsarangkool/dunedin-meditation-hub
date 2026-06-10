"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthButton() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setIsLoggedIn(!!data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setIsLoggedIn(!!session);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (isLoggedIn) {
    return (
      <button
        onClick={handleLogout}
        className="rounded-xl bg-red-600 px-5 py-3 font-semibold text-white"
      >
        Logout
      </button>
    );
  }

  return (
    <Link
      href="/login"
      className="rounded-xl bg-green-700 px-5 py-3 font-semibold text-white"
    >
      Login
    </Link>
  );
}