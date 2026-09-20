/**
 * Evaluate a CSS-style cubic Bézier easing `[x1, y1, x2, y2]` at progress `t`.
 *
 * Solves the parametric x(s) = t for the curve parameter `s` (Newton with a
 * bisection fallback), then returns y(s). Endpoints are fixed at (0,0)–(1,1).
 *
 * @evidence requirements/motion/clips-keyframes-and-interpolation.md#motion-interpolation Evaluates an authored cubic curve while preserving its fixed endpoints.
 * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clip-keytime-interpolation Resolves cubic control points into deterministic segment progress.
 * @author Samchon
 */
export const cubicBezierEasing = (
  control: readonly [number, number, number, number],
  t: number,
): number => {
  if (!Number.isFinite(t)) throw new Error("easing progress must be finite");
  for (const value of control)
    if (!Number.isFinite(value))
      throw new Error("cubic bezier control points must be finite");

  const [x1, y1, x2, y2] = control;
  const x = Math.min(1, Math.max(0, t));
  const bez = (a: number, b: number, s: number): number => {
    const c = 3 * a;
    const d = 3 * (b - a) - c;
    const e = 1 - c - d;
    return ((e * s + d) * s + c) * s;
  };
  const dbez = (a: number, b: number, s: number): number => {
    const c = 3 * a;
    const d = 3 * (b - a) - c;
    const e = 1 - c - d;
    return (3 * e * s + 2 * d) * s + c;
  };

  let s = x;
  for (let i = 0; i < 8; ++i) {
    const dx = bez(x1, x2, s) - x;
    if (Math.abs(dx) < 1e-5) break;
    const slope = dbez(x1, x2, s);
    if (Math.abs(slope) < 1e-6) break;
    s -= dx / slope;
  }
  s = Math.min(1, Math.max(0, s));
  // Newton stalls where x'(s) ≈ 0 (a legal steep curve like [1,0,0,1]); when
  // the residual shows it did not converge, bisect on [0,1]: x(0)=0 and
  // x(1)=1, so a root exists, and CSS-legal control x's keep x(s) monotone.
  if (Math.abs(bez(x1, x2, s) - x) >= 1e-5) {
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 32; ++i) {
      s = (lo + hi) / 2;
      if (bez(x1, x2, s) < x) lo = s;
      else hi = s;
    }
    s = (lo + hi) / 2;
  }
  return bez(y1, y2, s);
};
