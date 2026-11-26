import { bracketedCrossing } from "../../math/internal/bracketedCrossing";

/**
 * Evaluate a CSS-style cubic Bézier easing `[x1, y1, x2, y2]` at progress `t`.
 *
 * Solves the parametric x(s) = t for the curve parameter `s` (Newton with a
 * bisection fallback), then returns y(s). Endpoints are fixed at (0,0)–(1,1).
 * The caller supplies CSS-legal x controls in [0,1], as validateMotion
 * requires; finite y controls may overshoot the output interval. Progress is
 * clamped to [0,1].
 */
export function cubicBezierEasing(
  control: readonly [number, number, number, number],
  t: number,
): number {
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
    // The bracket is closed to the width 32 bisections leave
    // (`bracketedCrossing`: false position on the cubic, then bisection for
    // whatever width that leaves), and its middle taken as before.
    const closed: { low: number; high: number } = bracketedCrossing({
      f: (at: number): number => bez(x1, x2, at) - x,
      past: (excess: number): boolean => !(excess < 0),
      low: 0,
      high: 1,
      tolerance: 2 ** -HALVINGS,
    });
    s = (closed.low + closed.high) / 2;
  }
  return bez(y1, y2, s);
}

/** The bisections whose final bracket width the fallback closes to. */
const HALVINGS: number = 32;
