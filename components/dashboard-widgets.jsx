"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

function formatValue(value, prefix = "", suffix = "") {
  return `${prefix}${value}${suffix}`;
}

export function CountUpValue({ value, prefix = "", suffix = "" }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let frame = 0;
    let animationFrame = 0;
    const totalFrames = 30;

    function tick() {
      frame += 1;
      const progress = 1 - (1 - frame / totalFrames) ** 3;
      setDisplayValue(Math.round(value * progress));
      if (frame < totalFrames) {
        animationFrame = window.requestAnimationFrame(tick);
      }
    }

    animationFrame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(animationFrame);
  }, [value]);

  return <span>{formatValue(displayValue, prefix, suffix)}</span>;
}

export function DashboardPanel({ children, className = "" }) {
  return (
    <div className={`rounded-[2rem] border border-white/10 bg-[#1a1d25]/95 p-6 shadow-[0_22px_60px_rgba(0,0,0,0.24)] backdrop-blur-xl ${className}`}>
      {children}
    </div>
  );
}

export function SectionHeading({ eyebrow, title, detail, action }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        {eyebrow ? <p className="text-sm font-black uppercase tracking-[0.16em] text-[#72d9f8]">{eyebrow}</p> : null}
        <h3 className="mt-2 text-3xl font-black leading-tight text-white sm:text-4xl">{title}</h3>
        {detail ? <p className="mt-3 max-w-2xl text-base leading-7 text-slate-300">{detail}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function MiniBarChart({ data }) {
  const maxValue = Math.max(...data.map((item) => item.value), 1);
  const roundedMax = Math.ceil(maxValue / 10) * 10;
  const yAxisValues = [roundedMax, Math.round(roundedMax * 0.75), Math.round(roundedMax * 0.5), Math.round(roundedMax * 0.25), 0];

  return (
    <div className="mt-8 grid gap-4 lg:grid-cols-[64px_minmax(0,1fr)]">
      <div className="relative hidden h-64 lg:block">
        {yAxisValues.map((tickValue, index) => (
          <div
            key={tickValue}
            className="absolute left-0 right-0 flex items-center justify-end gap-3"
            style={{ top: `${(index / (yAxisValues.length - 1)) * 100}%`, transform: "translateY(-50%)" }}
          >
            <span className="text-xs font-semibold text-slate-500">{tickValue}m</span>
          </div>
        ))}
      </div>

      <div className="grid gap-4">
        <div className="relative h-64">
          {yAxisValues.map((tickValue, index) => (
            <div
              key={tickValue}
              className="absolute left-0 right-0 border-t border-white/8"
              style={{ top: `${(index / (yAxisValues.length - 1)) * 100}%` }}
            />
          ))}
          <div className="absolute inset-x-0 bottom-0 flex h-full items-end gap-3">
            {data.map((item, index) => (
              <div key={item.label} className="flex h-full flex-1 items-end">
                <motion.div
                  initial={{ height: 0 }}
                  whileInView={{ height: `${(item.value / roundedMax) * 100}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
                  className={`w-full rounded-t-[1rem] bg-gradient-to-t ${item.gradient}`}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-7 gap-3">
          {data.map((item, index) => (
            <div key={item.label} className="text-center">
              <div className="text-center">
                <p className="text-sm font-black text-white">{item.value}m</p>
                <p className="text-xs text-slate-400">{item.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ProgressDial({ value, label, accent = "cyan" }) {
  const gradients = {
    cyan: "from-cyan-300 via-blue-500 to-violet-500",
    lime: "from-lime-300 via-emerald-400 to-cyan-500",
    rose: "from-fuchsia-400 via-rose-500 to-orange-400"
  };
  const gradientClass = gradients[accent] || gradients.cyan;

  return (
    <div className="relative overflow-hidden rounded-[1.6rem] border border-white/8 bg-white/5 p-4">
      <motion.div
        initial={{ height: 0 }}
        whileInView={{ height: `${value}%` }}
        viewport={{ once: true }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className={`absolute inset-x-0 bottom-0 bg-gradient-to-t ${gradientClass} opacity-95`}
      />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),transparent_35%)]" />
      <div className="relative z-10 flex min-h-[18rem] flex-col justify-between">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-2xl font-black text-white">
              <CountUpValue value={value} suffix="%" />
            </p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-300">{label}</p>
          </div>
          <div className="relative h-11 w-5 rounded-[0.7rem] border border-white/15 bg-white/[0.08]">
            <div className="absolute right-[-5px] top-1/2 h-3.5 w-1.5 -translate-y-1/2 rounded-r-sm bg-white/20" />
            <motion.div
              initial={{ height: 0 }}
              whileInView={{ height: `${Math.max(8, value)}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className={`absolute inset-x-[2px] bottom-[2px] rounded-[0.45rem] bg-gradient-to-t ${gradientClass}`}
            />
          </div>
        </div>

        <div className="h-2 rounded-full bg-white/12">
          <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: `${value}%` }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="h-2 rounded-full bg-white/55"
          />
        </div>
      </div>
    </div>
  );
}

export function FillProgress({ value, gradient, label, caption }) {
  return (
    <div className="relative overflow-hidden rounded-[1.4rem] border border-white/8 bg-black/20 p-4">
      <motion.div
        initial={{ width: 0 }}
        whileInView={{ width: `${value}%` }}
        viewport={{ once: true }}
        transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
        className={`absolute inset-y-0 left-0 bg-gradient-to-r ${gradient} opacity-95`}
      />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.05),transparent_45%)]" />
      <div className="relative z-10 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-white">{label}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-500">{caption}</p>
        </div>
        <p className="text-lg font-black text-white">
          <CountUpValue value={value} suffix="%" />
        </p>
      </div>
      <div className="relative z-10 mt-4 h-2 rounded-full bg-white/8">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${value}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
          className={`h-2 rounded-full bg-gradient-to-r ${gradient}`}
        />
      </div>
    </div>
  );
}
