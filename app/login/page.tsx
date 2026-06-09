"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    if (
      username === "admin" &&
      password === "meditation2025"
    ) {
      localStorage.setItem("admin", "true");
      router.push("/");
    } else {
      alert("Username หรือ Password ไม่ถูกต้อง");
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#f7f3ea]">
      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md"
      >
        <h1 className="text-2xl font-bold mb-6 text-center">
          Admin Login
        </h1>

        <input
          type="text"
          placeholder="Username"
          className="w-full border p-3 rounded-lg mb-4"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full border p-3 rounded-lg mb-4"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          type="submit"
          className="w-full bg-green-700 text-white py-3 rounded-lg"
        >
          Login
        </button>
      </form>
    </main>
  );
}