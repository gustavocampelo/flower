import { CONFIG } from './config.ts';
export const clamp = (v: number) => Math.max(0, Math.min(1, v));
export const smooth = (a: number, b: number, t: number) => { const p = clamp((t-a)/(b-a)); return p*p*(3-2*p); };
export function inspectionParameters(search: string) {
  const p = new URLSearchParams(search); const raw = Number(p.get('t') ?? 0);
  return { time: Number.isFinite(raw) ? Math.max(0, Math.min(3600, raw)) : 0, paused: p.get('paused') === '1', debug: p.get('debug') === '1', dpr: Math.max(0.5, Math.min(2, Number(p.get('dpr')) || CONFIG.ascii.maxDpr)) };
}
