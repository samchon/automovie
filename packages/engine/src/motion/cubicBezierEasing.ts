/**
 * Evaluate a CSS-style cubic Bézier easing `[x1, y1, x2, y2]` at progress `t`.
 *
 * Solves the parametric x(s) = t for the curve parameter `s` (Newton with a
 * bisection fallback), then returns y(s). Endpoints are fixed at (0,0)–(1,1).
 * The caller supplies CSS-legal x controls in [0,1], as validateMotion requires; finite y controls may overshoot the output interval. Progress is clamped to [0,1].
 *
 * @evidence contracts/common.md#principled-implementation Solves cubic x(s)=clamped progress with at most eight Newton steps then 32 bisections when the x residual remains at least 1e-5; CSS-legal x controls make x(s) monotone, while finite y controls may produce intentional overshoot.
 * @evidence contracts/common.md#clear-and-simple-design The local cubic and derivative share Horner-form coefficients; residual-based fallback stays with this one inverse-easing owner rather than changing the motion sampler.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Nonfinite progress or controls throw; the 1e-6 derivative cutoff and 1e-5 residual select a bounded numerical fallback, while CSS x-domain admission remains validateMotion's caller premise.
 * @evidence contracts/common.md#meaningful-documentation Gives fixed endpoints, clamped progress, CSS x-domain premise, finite y overshoot and Newton/bisection method.
 * @evidence contracts/performance.md#efficient-algorithms Constant-degree Horner evaluation inside fixed eight/32 iteration bounds gives constant time and scalar storage, without constructing sampled curve tables.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The same control values serve cubic and derivative evaluation within one inversion; no cache assumes mutable control tuples remain unchanged between calls.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Only a numeric eased progress escapes; all coefficients and search bounds are call-local with no handles or retained tables.
 */
export const cubicBezierEasing: (
  control: readonly [number, number, number, number],
  t: number,
) => number = (
  control: readonly [number, number, number, number],
  t: number,
): number => {
  if (!Number.isFinite(t)) throw new Error("easing progress must be finite");
  for (const value of control)
    if (!Number.isFinite(value))
      throw new Error("cubic bezier control points must be finite");

  const [x1, y1, x2, y2]: readonly [number, number, number, number] = control;
  const x: number = Math.min(1, Math.max(0, t));
  const bez: (a: number, b: number, s: number) => number = (
    a: number,
    b: number,
    s: number,
  ): number => {
    const c: number = 3 * a;
    const d: number = 3 * (b - a) - c;
    const e: number = 1 - c - d;
    return ((e * s + d) * s + c) * s;
  };
  const dbez: (a: number, b: number, s: number) => number = (
    a: number,
    b: number,
    s: number,
  ): number => {
    const c: number = 3 * a;
    const d: number = 3 * (b - a) - c;
    const e: number = 1 - c - d;
    return (3 * e * s + 2 * d) * s + c;
  };

  let s: number = x;
  for (let i: number = 0; i < 8; ++i) {
    const dx: number = bez(x1, x2, s) - x;
    if (Math.abs(dx) < 1e-5) break;
    const slope: number = dbez(x1, x2, s);
    if (Math.abs(slope) < 1e-6) break;
    s -= dx / slope;
  }
  s = Math.min(1, Math.max(0, s));
  // Newton stalls where x'(s) ≈ 0 (a legal steep curve like [1,0,0,1]); when
  // the residual shows it did not converge, bisect on [0,1]: x(0)=0 and
  // x(1)=1, so a root exists, and CSS-legal control x's keep x(s) monotone.
  if (Math.abs(bez(x1, x2, s) - x) >= 1e-5) {
    let lo: number = 0;
    let hi: number = 1;
    for (let i: number = 0; i < 32; ++i) {
      s = (lo + hi) / 2;
      if (bez(x1, x2, s) < x) lo = s;
      else hi = s;
    }
    s = (lo + hi) / 2;
  }
  return bez(y1, y2, s);
};
