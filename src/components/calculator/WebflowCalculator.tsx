import { useEffect, useMemo, useState } from "react";
import {
  calculate,
  cmsOptions,
  defaultInputs,
  experienceEfficiencyFee,
  experienceHourlyRate,
  formatMoney,
  integrationOptions,
  type Inputs,
} from "./logic";
import { Gauge } from "./Gauge";

const STEPS = ["Experience", "Scope", "Project", "Bonus", "Availability"] as const;

/* ---------- Small reusable building blocks ---------- */

function Pill({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-6 py-3 text-sm font-medium transition-all ${
        active
          ? "border-brand bg-brand text-brand-foreground shadow-[0_8px_20px_-8px_var(--brand)]"
          : "border-border bg-card text-foreground hover:border-brand/40"
      }`}
    >
      {children}
    </button>
  );
}

function Field({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <h3 className="font-display text-xl font-bold tracking-tight text-foreground">{title}</h3>
      {hint && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}
      <div className="mt-5">{children}</div>
    </div>
  );
}

function NumberInput({
  value,
  onChange,
  prefix,
  suffix,
  min = 0,
  max,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  prefix?: string;
  suffix?: string;
  min?: number;
  max?: number;
  disabled?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-1 rounded-full border border-border bg-background px-4 py-2 ${
        disabled ? "opacity-50" : ""
      }`}
    >
      {prefix && <span className="text-muted-foreground">{prefix}</span>}
      <input
        type="number"
        disabled={disabled}
        value={Number.isNaN(value) ? "" : value}
        min={min}
        max={max}
        onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))}
        className="w-full bg-transparent text-lg font-semibold text-foreground outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
      />
      {suffix && <span className="text-muted-foreground">{suffix}</span>}
    </div>
  );
}

function ChipGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-3">
      {options.map((o) => (
        <Pill key={o.value} active={value === o.value} onClick={() => onChange(o.value)}>
          {o.label}
        </Pill>
      ))}
    </div>
  );
}

function MultiChips({
  options,
  selected,
  onChange,
}: {
  options: string[];
  selected: number[];
  onChange: (next: number[]) => void;
}) {
  const toggle = (idx: number) => {
    if (idx === 0) {
      onChange([0]);
      return;
    }
    let next = selected.filter((s) => s !== 0);
    next = next.includes(idx) ? next.filter((s) => s !== idx) : [...next, idx];
    onChange(next.length ? next : [0]);
  };
  return (
    <div className="flex flex-wrap gap-2.5">
      {options.map((label, idx) => (
        <button
          key={label}
          type="button"
          onClick={() => toggle(idx)}
          className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
            selected.includes(idx)
              ? "border-brand bg-brand text-brand-foreground"
              : "border-border bg-card text-foreground hover:border-brand/40"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

/* ---------- Main component ---------- */

export function WebflowCalculator() {
  useEffect(() => {
    const el = document.querySelector("code-island");
    const shadow = el?.shadowRoot;
    const target = shadow ?? document.head;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://wff-calc-module.vercel.app/assets/index-B88Yk4g5.css";
    target.appendChild(link);
  }, []);

  const [step, setStep] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [inputs, setInputs] = useState<Inputs>(defaultInputs);

  const set = <K extends keyof Inputs>(key: K, value: Inputs[K]) =>
    setInputs((prev) => ({ ...prev, [key]: value }));

  // Mirror the original auto-fill: experience drives default hourly rate + efficiency fee.
  const setExperience = (exp: Inputs["experience"]) =>
    setInputs((prev) => ({
      ...prev,
      experience: exp,
      hourlyRate: experienceHourlyRate[exp],
      efficiencyFee: experienceEfficiencyFee[exp],
    }));

  const results = useMemo(() => calculate(inputs), [inputs]);

  const next = () => (step < STEPS.length - 1 ? setStep(step + 1) : setShowResults(true));
  const back = () => setStep(Math.max(0, step - 1));

  const reset = () => {
    setShowResults(false);
    setStep(0);
  };

  return (
    <div className="font-body w-full bg-secondary p-4 sm:p-8">
      <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[260px_1fr]">
        {/* Sidebar */}
        <aside className="hidden self-start rounded-3xl bg-brand p-8 text-brand-foreground lg:block">
          <ol className="space-y-5">
            {STEPS.map((label, i) => (
              <li
                key={label}
                className={`font-display text-2xl font-bold transition-all ${
                  !showResults && i === step ? "opacity-100" : "opacity-40"
                }`}
              >
                {label}
              </li>
            ))}
          </ol>
        </aside>

        {/* Card */}
        <main className="rounded-3xl bg-card p-6 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.25)] sm:p-8">
          {!showResults && (
            <p className="mb-6 text-sm font-medium uppercase tracking-wider text-brand lg:hidden">
              {STEPS[step]}
            </p>
          )}

          {showResults ? (
            <ResultsView results={results} onEdit={reset} />
          ) : (
            <>
              <div className="space-y-5">
                {step === 0 && <StepExperience inputs={inputs} set={set} setExperience={setExperience} />}
                {step === 1 && <StepScope inputs={inputs} set={set} />}
                {step === 2 && <StepProject inputs={inputs} set={set} />}
                {step === 3 && <StepBonus inputs={inputs} set={set} />}
                {step === 4 && <StepAvailability inputs={inputs} set={set} />}
              </div>

              <div className="mt-8 flex items-center justify-between">
                {step > 0 ? (
                  <button
                    type="button"
                    onClick={back}
                    className="rounded-full border border-border px-7 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
                  >
                    Back
                  </button>
                ) : (
                  <span />
                )}
                <button
                  type="button"
                  onClick={next}
                  className="rounded-full bg-brand px-9 py-3 text-sm font-semibold text-brand-foreground shadow-[0_10px_25px_-8px_var(--brand)] transition-transform hover:scale-[1.02]"
                >
                  {step === STEPS.length - 1 ? "Calculate" : "Next"}
                </button>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

/* ---------- Steps ---------- */

type StepProps = {
  inputs: Inputs;
  set: <K extends keyof Inputs>(key: K, value: Inputs[K]) => void;
};

function StepExperience({
  inputs,
  set,
  setExperience,
}: StepProps & { setExperience: (exp: Inputs["experience"]) => void }) {
  return (
    <>
      <Field
        title="How long have you been doing Webflow?"
        hint="Your skillset factors into flexibility, deadline and other aspects of the job"
      >
        <ChipGroup
          value={inputs.experience}
          onChange={setExperience}
          options={[
            { value: "experience-0", label: "1-12 months" },
            { value: "experience-1", label: "1-4 years" },
            { value: "experience-2", label: "4+ years" },
          ]}
        />
      </Field>
      <Field title="What's your hourly rate?" hint="Enter your usual rate, or the one you expect from this project">
        <div className="max-w-[200px]">
          <NumberInput value={inputs.hourlyRate} onChange={(v) => set("hourlyRate", v)} prefix="$" suffix="/h" />
        </div>
      </Field>
    </>
  );
}

function StepScope({ inputs, set }: StepProps) {
  return (
    <>
      <Field title="Layout Complexity?" hint="Take an honest look at your designs. How crazy are we talking?">
        <ChipGroup
          value={inputs.layoutComplexity}
          onChange={(v) => set("layoutComplexity", v)}
          options={[
            { value: "layout-complexity-0", label: "Simple" },
            { value: "layout-complexity-1", label: "Middling" },
            { value: "layout-complexity-2", label: "Complex" },
          ]}
        />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field title="Unique page layouts" hint="Pages you'll build manually from scratch">
          <div className="max-w-[160px]">
            <NumberInput value={inputs.uniqueLayouts} onChange={(v) => set("uniqueLayouts", v)} />
          </div>
        </Field>
        <Field title="Template-based layouts" hint="Build once, then repeat with different content">
          <div className="max-w-[160px]">
            <NumberInput value={inputs.templateLayouts} onChange={(v) => set("templateLayouts", v)} />
          </div>
        </Field>
      </div>
      <Field
        title="Interactions complexity"
        hint="Animations, transitions and usability quirks that ramp up complexity"
      >
        <ChipGroup
          value={inputs.interactionsComplexity}
          onChange={(v) => set("interactionsComplexity", v)}
          options={[
            { value: "interactions-complexity-0", label: "Static" },
            { value: "interactions-complexity-1", label: "Medium" },
            { value: "interactions-complexity-2", label: "Complex" },
          ]}
        />
      </Field>
      <Field title="CMS complexity" hint="If there's a CMS, we'll account for setup and hacking time">
        <MultiChips options={cmsOptions} selected={inputs.cms} onChange={(v) => set("cms", v)} />
      </Field>
      <Field title="Integrations" hint="Which services are we connecting?">
        <MultiChips
          options={integrationOptions}
          selected={inputs.integrations}
          onChange={(v) => set("integrations", v)}
        />
      </Field>
    </>
  );
}

function StepProject({ inputs, set }: StepProps) {
  return (
    <>
      <Field
        title="How interesting is the project?"
        hint="It's ok to charge less if the job's cool. Options 2 and 3 reduce your fee by 10% / -10%"
      >
        <ChipGroup
          value={inputs.interesting}
          onChange={(v) => set("interesting", v)}
          options={[
            { value: "interesting-0", label: "Booooring" },
            { value: "interesting-1", label: "Biz as usual" },
            { value: "interesting-2", label: "Can't wait!" },
          ]}
        />
      </Field>
      <Field
        title="How important is this client to you?"
        hint="Don't lose a dream client to a short-term paycheck"
      >
        <ChipGroup
          value={inputs.important}
          onChange={(v) => set("important", v)}
          options={[
            { value: "important-0", label: "Just money" },
            { value: "important-1", label: "Good portfolio" },
            { value: "important-2", label: "Life changer" },
          ]}
        />
      </Field>
    </>
  );
}

function PercentField({
  title,
  hint,
  value,
  onChange,
}: {
  title: string;
  hint: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <Field title={title} hint={hint}>
      <div className="max-w-[160px]">
        <NumberInput value={value} onChange={onChange} suffix="%" />
      </div>
    </Field>
  );
}

function StepBonus({ inputs, set }: StepProps) {
  return (
    <>
      <PercentField
        title="Profit (take home)"
        hint="The extra charge on top of your billable hours"
        value={inputs.profit}
        onChange={(v) => set("profit", v)}
      />
      <PercentField
        title="Efficiency fee?"
        hint="Covers the extra value experts deliver by shipping fast"
        value={inputs.efficiencyFee}
        onChange={(v) => set("efficiencyFee", v)}
      />
      <PercentField
        title="Rush fee?"
        hint="Charge more for adrenaline-fueled late nights. 10% is a good start"
        value={inputs.rushFee}
        onChange={(v) => set("rushFee", v)}
      />
      <PercentField
        title="What's your tax rate?"
        hint="Enter your tax rate and we'll calculate your take-home earnings"
        value={inputs.taxRate}
        onChange={(v) => set("taxRate", v)}
      />
      <PercentField
        title="How much of downpayment?"
        hint="Won't affect your price, but it'll figure on your proposal"
        value={inputs.downpayment}
        onChange={(v) => set("downpayment", v)}
      />
    </>
  );
}

function StepAvailability({ inputs, set }: StepProps) {
  return (
    <>
      <Field
        title="How many projects are you working on?"
        hint="Working on a lot? Bump your price and extend your deadline"
      >
        <div className="max-w-[160px]">
          <NumberInput value={inputs.projectsCount} onChange={(v) => set("projectsCount", v)} min={1} />
        </div>
      </Field>
      <Field
        title="How many hours/week can you commit?"
        hint="Estimate your weekly availability. Leave blank for 40h"
      >
        <div className="max-w-[160px]">
          <NumberInput value={inputs.commitedHours} onChange={(v) => set("commitedHours", v)} max={40} />
        </div>
      </Field>
      <PercentField
        title="Deadline buffer?"
        hint="Fend off procrastination by adding time to the real deadline"
        value={inputs.deadlineBuffer}
        onChange={(v) => set("deadlineBuffer", v)}
      />
    </>
  );
}

/* ---------- Results ---------- */

function ResultsView({
  results,
  onEdit,
}: {
  results: ReturnType<typeof calculate>;
  onEdit: () => void;
}) {
  const rows: [string, string][] = [
    ["Total quote", formatMoney(results.total)],
    ["Break even", formatMoney(results.breakEven)],
    ["Profit", formatMoney(results.profit)],
    ["Efficiency fee", formatMoney(results.efficiencyFee)],
    ["Rush fee", formatMoney(results.rushFee)],
    ["Tax", formatMoney(results.tax)],
    ["Downpayment", formatMoney(results.downpayment)],
  ];

  return (
    <div>
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
        <div className="text-center sm:text-left">
          <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Total Quote</p>
          <p className="font-display text-5xl font-extrabold text-foreground sm:text-6xl">
            ${results.totalInThousands.toFixed(1)}k
          </p>
          <p className="mt-1 text-muted-foreground">
            {results.totalWeeks} {results.totalWeeks === 1 ? "week" : "weeks"} · {results.hours} hours
          </p>
        </div>
        <Gauge weeks={results.totalWeeks} valueK={results.totalInThousands} />
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-border p-6">
          <h4 className="font-display text-lg font-bold text-foreground">Quote breakdown</h4>
          <dl className="mt-4 space-y-3">
            {rows.map(([label, val]) => (
              <div key={label} className="flex items-center justify-between border-b border-border/60 pb-2 text-sm">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="font-semibold text-foreground">{val}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="rounded-2xl border border-border p-6">
          <h4 className="font-display text-lg font-bold text-foreground">Deadline</h4>
          <dl className="mt-4 space-y-3">
            <div className="flex items-center justify-between border-b border-border/60 pb-2 text-sm">
              <dt className="text-muted-foreground">Total deadline</dt>
              <dd className="font-semibold text-foreground">{results.totalWeeks} weeks</dd>
            </div>
            <div className="flex items-center justify-between border-b border-border/60 pb-2 text-sm">
              <dt className="text-muted-foreground">Buffer time</dt>
              <dd className="font-semibold text-foreground">{results.bufferWeeks} weeks</dd>
            </div>
            <div className="flex items-center justify-between border-b border-border/60 pb-2 text-sm">
              <dt className="text-muted-foreground">Total hours</dt>
              <dd className="font-semibold text-foreground">{results.hours} hours</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="mt-8 text-center">
        <button
          type="button"
          onClick={onEdit}
          className="rounded-full border border-brand px-8 py-3 text-sm font-semibold text-brand transition-colors hover:bg-brand-soft"
        >
          Edit Calculation
        </button>
      </div>
    </div>
  );
}
