"use client";

import { useState } from "react";

interface Results {
  bmr: number;
  maintenance: number;
  recommendedDeficit: number;
  dailyTarget: number;
  weeklyLoss: number;
  weeksToGoal: number;
  monthsToGoal: number;
  weightToLose: number;
  isLosing: boolean;
  safeMinimumApplied: boolean;
}

type Step = "form" | "email" | "results";

export default function Home() {
  const [step, setStep] = useState<Step>("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<Results | null>(null);

  // Form state
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("male");
  const [activityLevel, setActivityLevel] = useState("1.55");
  const [desiredWeight, setDesiredWeight] = useState("");
  const [email, setEmail] = useState("");

  function handleCalculate(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!weight || !height || !age || !desiredWeight) {
      setError("Fill in all fields.");
      return;
    }

    if (
      Number(weight) <= 0 ||
      Number(height) <= 0 ||
      Number(age) <= 0 ||
      Number(desiredWeight) <= 0
    ) {
      setError("All values must be positive.");
      return;
    }

    setStep("email");
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          weight: Number(weight),
          height: Number(height),
          age: Number(age),
          gender,
          activityLevel: Number(activityLevel),
          desiredWeight: Number(desiredWeight),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        setLoading(false);
        return;
      }

      setResults(data.results);
      setStep("results");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setStep("form");
    setResults(null);
    setEmail("");
    setError("");
  }

  return (
    <div className="flex flex-col min-h-screen bg-black">
      {/* Hero */}
      <header className="w-full pt-16 pb-8 px-6 text-center">
        <p className="text-sm tracking-widest uppercase text-secondary mb-4 font-mono">
          Episode 4 / 50 Shades of AI
        </p>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-light tracking-tight text-foreground leading-tight">
          How many calories
          <br />
          do <span className="italic">you</span> need?
        </h1>
        <p className="mt-4 text-secondary text-lg max-w-md mx-auto">
          The exact math behind losing weight. No BS.
        </p>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-xl mx-auto px-6 pb-20">
        {/* Calculator Form */}
        {step === "form" && (
          <form onSubmit={handleCalculate} className="fade-in">
            <div className="frost-border rounded-2xl p-6 sm:p-8 mt-8">
              <h2 className="text-lg font-medium text-foreground mb-6">
                Your numbers
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-secondary mb-1.5 uppercase tracking-wider">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="75"
                    step="0.1"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-xs text-secondary mb-1.5 uppercase tracking-wider">
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    placeholder="175"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-xs text-secondary mb-1.5 uppercase tracking-wider">
                    Age
                  </label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="28"
                    min="1"
                    max="120"
                  />
                </div>
                <div>
                  <label className="block text-xs text-secondary mb-1.5 uppercase tracking-wider">
                    Gender
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-xs text-secondary mb-1.5 uppercase tracking-wider">
                  Activity Level
                </label>
                <select
                  value={activityLevel}
                  onChange={(e) => setActivityLevel(e.target.value)}
                >
                  <option value="1.2">Sedentary (desk job, no exercise)</option>
                  <option value="1.375">
                    Light (exercise 1-3 days/week)
                  </option>
                  <option value="1.55">
                    Moderate (exercise 3-5 days/week)
                  </option>
                  <option value="1.725">
                    Very Active (exercise 6-7 days/week)
                  </option>
                  <option value="1.9">
                    Super Active (athlete / physical job)
                  </option>
                </select>
              </div>

              <div className="mt-4">
                <label className="block text-xs text-secondary mb-1.5 uppercase tracking-wider">
                  Desired Weight (kg)
                </label>
                <input
                  type="number"
                  value={desiredWeight}
                  onChange={(e) => setDesiredWeight(e.target.value)}
                  placeholder="68"
                  step="0.1"
                  min="1"
                />
              </div>

              {error && (
                <p className="mt-4 text-sm text-red-400">{error}</p>
              )}

              <button
                type="submit"
                className="w-full mt-6 py-3 rounded-full bg-white text-black font-medium text-sm hover:bg-white/90 transition-colors cursor-pointer"
              >
                Calculate
              </button>
            </div>
          </form>
        )}

        {/* Email Gate */}
        {step === "email" && (
          <div className="fade-in">
            <div className="frost-border rounded-2xl p-6 sm:p-8 mt-8 text-center">
              <div className="w-12 h-12 rounded-full frost-border flex items-center justify-center mx-auto mb-4">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="text-secondary"
                >
                  <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>

              <h2 className="text-lg font-medium text-foreground mb-2">
                Your results are ready
              </h2>
              <p className="text-secondary text-sm mb-6">
                Enter your email to see your personalized calorie breakdown.
                <br />
                <span className="text-tertiary text-xs">
                  We will also send you a copy.
                </span>
              </p>

              <form onSubmit={handleEmailSubmit}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="text-center"
                />

                {error && (
                  <p className="mt-3 text-sm text-red-400">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-4 py-3 rounded-full bg-white text-black font-medium text-sm hover:bg-white/90 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {loading ? "Calculating..." : "Show My Results"}
                </button>
              </form>

              <button
                onClick={() => setStep("form")}
                className="mt-3 text-xs text-tertiary hover:text-secondary transition-colors cursor-pointer"
              >
                Back to calculator
              </button>
            </div>
          </div>
        )}

        {/* Results */}
        {step === "results" && results && (
          <div className="fade-in mt-8 space-y-4">
            {/* Primary Stats */}
            <div className="frost-border rounded-2xl p-6 sm:p-8">
              <h2 className="text-lg font-medium text-foreground mb-6">
                Your breakdown
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <StatCard label="BMR" value={`${results.bmr}`} unit="cal/day" />
                <StatCard
                  label="Maintenance"
                  value={`${results.maintenance}`}
                  unit="cal/day"
                  accent
                />
              </div>
            </div>

            {/* Plan */}
            {results.isLosing && (
              <div className="frost-border rounded-2xl p-6 sm:p-8">
                <h2 className="text-lg font-medium text-foreground mb-6">
                  Your plan
                </h2>

                <div className="grid grid-cols-2 gap-4">
                  <StatCard
                    label="Daily Target"
                    value={`${results.dailyTarget}`}
                    unit="cal/day"
                    highlight
                  />
                  <StatCard
                    label="Daily Deficit"
                    value={`-${results.recommendedDeficit}`}
                    unit="cal/day"
                  />
                  <StatCard
                    label="Weekly Loss"
                    value={`${results.weeklyLoss}`}
                    unit="kg/week"
                  />
                  <StatCard
                    label="Weight to Lose"
                    value={`${results.weightToLose}`}
                    unit="kg"
                  />
                </div>
              </div>
            )}

            {/* Timeline */}
            {results.isLosing && results.monthsToGoal > 0 && (
              <div className="frost-border rounded-2xl p-6 sm:p-8 text-center">
                <p className="text-xs text-secondary uppercase tracking-wider mb-2">
                  Estimated timeline to goal
                </p>
                <p className="text-5xl font-light font-mono text-foreground tracking-tight">
                  {results.monthsToGoal}
                </p>
                <p className="text-secondary text-sm mt-1">months</p>
                <p className="text-tertiary text-xs mt-1">
                  ({results.weeksToGoal} weeks at {results.weeklyLoss} kg/week)
                </p>

                {results.safeMinimumApplied && (
                  <p className="mt-4 text-xs text-amber-400/80 frost-border rounded-lg p-3">
                    Your deficit was adjusted to maintain safe minimum calorie
                    intake. Going below {gender === "male" ? "1,500" : "1,200"}{" "}
                    cal/day is not recommended.
                  </p>
                )}
              </div>
            )}

            {/* Not losing */}
            {!results.isLosing && (
              <div className="frost-border rounded-2xl p-6 sm:p-8 text-center">
                <p className="text-secondary text-sm">
                  Your desired weight is at or above your current weight.
                  <br />
                  Eat at maintenance ({results.maintenance} cal/day) and focus on
                  strength training.
                </p>
              </div>
            )}

            {/* Disclaimer */}
            <p className="text-xs text-tertiary text-center pt-2">
              These are estimates based on the Mifflin-St Jeor equation. Consult
              a healthcare professional before making significant dietary
              changes.
            </p>

            <button
              onClick={handleReset}
              className="w-full py-3 rounded-full frost-border text-secondary text-sm hover:text-foreground transition-colors cursor-pointer"
            >
              Calculate again
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full py-8 text-center" style={{ borderTop: "1px solid rgba(214, 235, 253, 0.19)" }}>
        <p className="text-sm text-secondary">
          Episode 4 of{" "}
          <span className="text-foreground font-medium">
            50 Shades of AI
          </span>{" "}
          by Divy Kairoth
        </p>
        <div className="flex items-center justify-center gap-4 mt-3">
          <a
            href="https://www.linkedin.com/in/divy-kairoth/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-tertiary hover:text-secondary transition-colors"
          >
            LinkedIn
          </a>
          <span className="text-tertiary/40">|</span>
          <a
            href="https://divykairoth.substack.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-tertiary hover:text-secondary transition-colors"
          >
            Substack
          </a>
          <span className="text-tertiary/40">|</span>
          <a
            href="https://divykairoth.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-tertiary hover:text-secondary transition-colors"
          >
            divykairoth.com
          </a>
        </div>
        <p className="text-xs text-tertiary/60 mt-3">
          Free tool. Calculate your calories. No BS.
        </p>
      </footer>
    </div>
  );
}

function StatCard({
  label,
  value,
  unit,
  accent,
  highlight,
}: {
  label: string;
  value: string;
  unit: string;
  accent?: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl p-4 ${
        highlight
          ? "bg-white/5 frost-border"
          : "frost-ring"
      }`}
    >
      <p className="text-xs text-secondary uppercase tracking-wider mb-1">
        {label}
      </p>
      <p
        className={`text-2xl font-light font-mono tracking-tight ${
          accent
            ? "text-accent-blue"
            : highlight
            ? "text-accent-green"
            : "text-foreground"
        }`}
      >
        {value}
      </p>
      <p className="text-xs text-tertiary mt-0.5">{unit}</p>
    </div>
  );
}
