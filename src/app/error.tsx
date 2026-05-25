"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const message =
    error?.message && error.message !== "[object Event]"
      ? error.message
      : "The app failed to load (often a stale dev cache or wrong port).";

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f6f8] p-6">
      <div className="max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-sm text-center">
        <h1 className="text-xl font-bold text-gray-900">Something went wrong</h1>
        <p className="mt-3 text-sm text-gray-600">{message}</p>
        <div className="mt-6 flex flex-col gap-2">
          <button
            onClick={() => reset()}
            className="rounded-lg bg-[#396bea] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#2a52b8]"
          >
            Try again
          </button>
          <a
            href="/login"
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            Back to login
          </a>
        </div>
        <p className="mt-4 text-xs text-gray-400">
          Tip: stop all <code>npm run dev</code> terminals, delete{" "}
          <code>.next</code>, then run <code>npm run dev</code> again.
        </p>
      </div>
    </div>
  );
}
