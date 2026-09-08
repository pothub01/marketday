"use client";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  // Keep the error boundary intentionally generic so internal details are not exposed.
  void error;
  return (
    <main className="simple-page error-page">
      <span className="kicker">Something went wrong</span>
      <h1>We couldn&apos;t load the market.</h1>
      <p>Please try again. Your basket will be safe.</p>
      <button className="primary" onClick={() => reset()}>Try again <span>→</span></button>
    </main>
  );
}
