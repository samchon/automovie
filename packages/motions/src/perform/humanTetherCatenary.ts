import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * The catenary of a slack line's length between two points, sampled from the
 * first to the second (Irvine 1981, Cable Structures): `y = a (cosh((x − x0)
 * / a) − cosh(−x0 / a))` along the level run `h` between the ends, its
 * parameter from `2a sinh(h / 2a) = sqrt(L² − v²)` solved by Newton's method
 * on `b = h / 2a`, and its vertex `x0 = h / 2 − a atanh(v / L)` placing it
 * through both ends. Ends that share a vertical hang the line straight down
 * from them, folded at its low point.
 *
 * @param from The near end.
 * @param to The far end.
 * @param length The line's length, longer than the ends' distance.
 * @returns The drawn points, the near end first and the far end last.
 */
export function humanTetherCatenary(
  from: IAutoMovieVector3,
  to: IAutoMovieVector3,
  length: number,
): IAutoMovieVector3[] {
  const across: IAutoMovieVector3 = {
    x: to.x - from.x,
    y: 0,
    z: to.z - from.z,
  };
  const h: number = Math.hypot(across.x, across.z);
  const v: number = to.y - from.y;
  // Hanging straight down from the higher end when the ends share a vertical.
  if (h < 1e-6) {
    const low: number = Math.min(from.y, to.y) - (length - Math.abs(v)) / 2;
    return [from, { x: from.x, y: low, z: from.z }, to];
  }
  // Solve 2a sinh(h / 2a) = sqrt(L² - v²) for a by Newton's method on b = h / 2a.
  const target: number = Math.sqrt(length * length - v * v) / h;
  let b: number = Math.sqrt(6 * (target - 1));
  for (let i: number = 0; i < 30; ++i) {
    const f: number = Math.sinh(b) / b - target;
    const df: number = (Math.cosh(b) * b - Math.sinh(b)) / (b * b);
    const next: number = b - f / df;
    if (Math.abs(next - b) < 1e-12) break;
    b = next > 0 ? next : b / 2;
  }
  const a: number = h / (2 * b);
  const x0: number = h / 2 - a * Math.atanh(v / length);
  const y: (x: number) => number = (x: number): number =>
    a * (Math.cosh((x - x0) / a) - Math.cosh(-x0 / a));
  const unit: IAutoMovieVector3 = { x: across.x / h, y: 0, z: across.z / h };
  return Array.from(
    { length: humanTetherCatenary.SAMPLES + 1 },
    (_v: unknown, k: number): IAutoMovieVector3 => {
      const x: number = (h * k) / humanTetherCatenary.SAMPLES;
      return {
        x: from.x + unit.x * x,
        y: from.y + y(x),
        z: from.z + unit.z * x,
      };
    },
  );
}

/** The sampling of {@link humanTetherCatenary}. */
export namespace humanTetherCatenary {
  /** The pieces a slack line is drawn in. */
  export const SAMPLES: number = 16;
}