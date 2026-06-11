import { useEffect, useState } from "react";

/**
 * Animated speed-dial gauge, inspired by the original calculator's pointer dial.
 */
export function Gauge({ weeks, valueK }: { weeks: number; valueK: number }) {
  const maxWeeks = 20;
  const ratio = Math.min(weeks / maxWeeks, 1);
  const targetAngle = -90 + ratio * 180; // -90deg (left) .. 90deg (right)

  const [angle, setAngle] = useState(-90);
  const [shownK, setShownK] = useState(0);

  useEffect(() => {
    setAngle(-90);
    setShownK(0);
    const raf = requestAnimationFrame(() => setAngle(targetAngle));
    const start = performance.now();
    const duration = 900;
    let id = 0;
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      setShownK(Number((valueK * t).toFixed(1)));
      if (t < 1) id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(id);
    };
  }, [targetAngle, valueK]);

  const ticks = Array.from({ length: 21 });

  return (
    <div className="relative h-[140px] w-[260px] shrink-0">
      <svg viewBox="0 0 260 150" className="h-full w-full">
        {ticks.map((_, i) => {
          const a = (-90 + (i / 20) * 180) * (Math.PI / 180);
          const r1 = 110;
          const r2 = 122;
          const cx = 130;
          const cy = 135;
          const active = i / 20 <= ratio;
          return (
            <line
              key={i}
              x1={cx + r1 * Math.sin(a)}
              y1={cy - r1 * Math.cos(a)}
              x2={cx + r2 * Math.sin(a)}
              y2={cy - r2 * Math.cos(a)}
              stroke={active ? "var(--brand)" : "var(--border)"}
              strokeWidth={3}
              strokeLinecap="round"
              style={{ transition: "stroke 0.4s ease" }}
            />
          );
        })}
        {/* pointer */}
        <g
          style={{
            transform: `rotate(${angle}deg)`,
            transformOrigin: "130px 135px",
            transition: "transform 0.9s cubic-bezier(.22,1,.36,1)",
          }}
        >
          <line x1={130} y1={135} x2={130} y2={40} stroke="var(--brand)" strokeWidth={4} strokeLinecap="round" />
          <circle cx={130} cy={135} r={8} fill="var(--brand)" />
        </g>
      </svg>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 text-center">
        <span className="font-display text-2xl font-extrabold text-foreground">${shownK.toFixed(1)}k</span>
      </div>
    </div>
  );
}
