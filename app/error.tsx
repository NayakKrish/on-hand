"use client";

export default function ErrorView({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="rounded-3xl bg-cream p-6">
      <h1 className="font-display text-2xl">Something spilled</h1>
      <p className="mt-2 text-ink-soft">{error.message}</p>
      <button type="button" onClick={reset} className="mt-4 rounded-full bg-ink px-4 py-2 text-cream">
        Try again
      </button>
    </div>
  );
}
