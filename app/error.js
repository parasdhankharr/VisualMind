"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-midnight px-4 py-8 text-white sm:px-8">
        <div className="fixed inset-0 bg-hero-grid bg-[length:42px_42px] opacity-25" />
        <main className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-3xl place-items-center">
          <section className="glass glow-ring rounded-[2rem] p-8 text-center">
            <p className="text-sm font-bold uppercase text-rose-300">Something broke</p>
            <h1 className="mt-3 text-4xl font-black">We hit an unexpected app error.</h1>
            <p className="mt-4 text-sm text-slate-300">
              Try loading the page again. If the issue continues, head back home and restart from a safe route.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => reset()}
                className="rounded-full bg-white px-6 py-3 font-black text-slate-950 transition hover:bg-slate-200"
              >
                Try again
              </button>
              <Link
                href="/"
                className="rounded-full border border-white/15 bg-white/5 px-6 py-3 font-black text-white transition hover:bg-white/10"
              >
                Go home
              </Link>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
