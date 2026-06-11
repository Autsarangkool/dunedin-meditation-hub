"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function AuthButton() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(document.cookie.includes("sb-access-token="));
  }, []);

  function handleLogout() {
    document.cookie =
      "sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

    window.location.href = "/login";
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