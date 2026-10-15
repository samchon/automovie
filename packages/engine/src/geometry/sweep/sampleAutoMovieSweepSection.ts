import { IAutoMovieSweepSection } from "./IAutoMovieSweepSection";
import { interpolateAutoMovieMonotone } from "./interpolateAutoMovieMonotone";

/** Curve samples per segment when bracketing a polar angle. */
const DENSITY: number = 64;

/** Fewest curve samples whatever the segment count. */
const MINIMUM_SAMPLES: number = 1024;

/** Bisection steps that place a radius on the curve, each halving the parameter interval. */
const BISECTIONS: number = 40;

/**
 * Sample a section's radius from its origin at evenly spaced polar angles.
 *
 * Radius `k` lies along angle `2 pi k / count`, measured counterclockwise from
 * the section plane's `+x` axis. A radial section is read through its periodic
 * monotone interpolation. Any other curve is first walked at 64 points per
 * segment (at least 1,024) to bracket each angle between two curve parameters,
 * then the parameter is bisected forty times against the curve's own polar
 * angle, so the radius lies on the exact curve rather than on a chord.
 *
 * The walk also proves the curve star-shaped about its origin and wound
 * counterclockwise: the polar angle must strictly increase between successive
 * points and turn once in total, or the curve is refused, because a ray would
 * then cross it more than once and the sweep could not pair its points by
 * direction.
 *
 * @param props.section The section, only read.
 * @param props.count Number of angles, an integer of at least 3.
 * @returns Radii in metres, one per angle, all positive.
 * @throws Error when the count is not an integer of at least 3, the section's numbers are not finite or out of range, or the curve passes through its origin, winds clockwise or is not star-shaped about it.
 *
 * @evidence contracts/common.md#principled-implementation The polar radius function of a star-shaped closed curve: a dense parameter walk brackets each direction and bisection on the curve's monotone polar angle converges to the unique crossing, accurate to 2^-40 of a bracket; the star-shape check is the strict increase of that angle, which is exactly the uniqueness premise.
 * @evidence contracts/common.md#clear-and-simple-design Evaluation of all four section kinds is local to this module, so the sweep compiler sees only radii by direction.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A non-star-shaped or clockwise curve is refused instead of being reordered or hulled, and out-of-range half-axes, exponents or point counts are refused rather than clamped.
 * @evidence contracts/common.md#meaningful-documentation States the angle convention, how each kind is read, the accuracy, the star-shape and winding proof, and every refusal.
 * @evidence contracts/performance.md#efficient-algorithms For S curve segments and C angles: O(64 S) for the walk and O(C (log S + 40)) for bracketing and bisection; a radial section costs O(C) after its O(m) interpolant.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Called once per station when a sweep compiles; the compiled sweep keeps the radii.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains nothing; the walk's arrays, O(64 S), are released on return and the radii array is transferred to the caller.
 */
export const sampleAutoMovieSweepSection: (props: {
  section: IAutoMovieSweepSection;
  count: number;
}) => number[] = (props: {
  section: IAutoMovieSweepSection;
  count: number;
}): number[] => {
  const { section, count } = props;
  if (!Number.isSafeInteger(count) || count < 3)
    throw new Error("section sampling needs an integer count of at least 3");
  const angles: number[] = Array.from(
    { length: count },
    (_: unknown, k: number): number => (2 * Math.PI * k) / count,
  );
  if (section.type === "radial") {
    const m: number = section.radii.length;
    if (m < 3) throw new Error("radial section needs at least three radii");
    section.radii.forEach((r: number, k: number): void => {
      if (!Number.isFinite(r) || r <= 0)
        throw new Error(`radial section radius ${k} must be positive and finite`);
    });
    const radius: (angle: number) => number = interpolateAutoMovieMonotone({
      knots: section.radii.map((_: number, k: number): number => (2 * Math.PI * k) / m),
      values: section.radii,
      period: 2 * Math.PI,
    });
    return angles.map(radius);
  }
  const curve: { point: (t: number) => IAutoMovieSweepSection.IPoint; segments: number } =
    parameterize(section);
  const samples: number = Math.max(MINIMUM_SAMPLES, DENSITY * curve.segments);
  // unwrapped polar angle at each walk parameter, strictly increasing by one turn
  const ts: number[] = [];
  const phis: number[] = [];
  let previous: number = 0;
  let previousRaw: number = 0;
  for (let i: number = 0; i <= samples; ++i) {
    const t: number = i / samples;
    const p: IAutoMovieSweepSection.IPoint = curve.point(t);
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y))
      throw new Error("section curve is not finite");
    if (Math.hypot(p.x, p.y) === 0) throw new Error("section curve passes through its origin");
    const raw: number = Math.atan2(p.y, p.x);
    let phi: number = raw;
    if (i > 0) {
      let step: number = raw - previousRaw;
      step -= 2 * Math.PI * Math.round(step / (2 * Math.PI));
      if (!(step > 0))
        throw new Error("section curve must be star-shaped about its origin and counterclockwise");
      phi = previous + step;
    }
    ts.push(t);
    phis.push(phi);
    previous = phi;
    previousRaw = raw;
  }
  if (Math.abs(phis[samples]! - phis[0]! - 2 * Math.PI) > 1e-6)
    throw new Error("section curve must turn once about its origin");
  const angleAt = (t: number, near: number): number => {
    const p: IAutoMovieSweepSection.IPoint = curve.point(t);
    let phi: number = Math.atan2(p.y, p.x);
    phi += 2 * Math.PI * Math.round((near - phi) / (2 * Math.PI));
    return phi;
  };
  return angles.map((target: number): number => {
    // the target on the walk's unwrapped scale
    const goal: number = target + 2 * Math.PI * Math.ceil((phis[0]! - target) / (2 * Math.PI));
    let low: number = 0;
    let high: number = samples;
    while (high - low > 1) {
      const middle: number = (low + high) >> 1;
      if (phis[middle]! <= goal) low = middle;
      else high = middle;
    }
    let a: number = ts[low]!;
    let b: number = ts[high]!;
    for (let step: number = 0; step < BISECTIONS; ++step) {
      const middle: number = (a + b) / 2;
      if (angleAt(middle, goal) <= goal) a = middle;
      else b = middle;
    }
    const p: IAutoMovieSweepSection.IPoint = curve.point((a + b) / 2);
    return Math.hypot(p.x, p.y);
  });
};

/** A section curve as a function of one parameter over `[0, 1]`, closed, with its segment count. */
const parameterize = (
  section: Exclude<IAutoMovieSweepSection, IAutoMovieSweepSection.IRadial>,
): { point: (t: number) => IAutoMovieSweepSection.IPoint; segments: number } => {
  if (section.type === "superellipse") {
    const half: number[] = [section.right, section.up, section.left, section.down];
    half.forEach((h: number): void => {
      if (!Number.isFinite(h) || h <= 0)
        throw new Error("superellipse half-axes must be positive and finite");
    });
    section.exponents.forEach((n: number): void => {
      if (!Number.isFinite(n) || n < 1 || n > 20)
        throw new Error("superellipse exponents must lie in [1, 20]");
    });
    const cx: number = section.centre?.x ?? 0;
    const cy: number = section.centre?.y ?? 0;
    if (!Number.isFinite(cx) || !Number.isFinite(cy))
      throw new Error("superellipse centre must be finite");
    return {
      segments: 4,
      point: (t: number): IAutoMovieSweepSection.IPoint => {
        const p: number = 2 * Math.PI * (t - Math.floor(t));
        const q: number = Math.min(3, Math.floor(p / (Math.PI / 2)));
        const n: number = section.exponents[q]!;
        const c: number = Math.cos(p);
        const s: number = Math.sin(p);
        const a: number = c >= 0 ? section.right : section.left;
        const b: number = s >= 0 ? section.up : section.down;
        return {
          x: cx + a * Math.sign(c) * Math.pow(Math.abs(c), 2 / n),
          y: cy + b * Math.sign(s) * Math.pow(Math.abs(s), 2 / n),
        };
      },
    };
  }
  const points: IAutoMovieSweepSection.IPoint[] = section.points;
  points.forEach((p: IAutoMovieSweepSection.IPoint, k: number): void => {
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y))
      throw new Error(`section point ${k} is not finite`);
  });
  const m: number = points.length;
  const at = (k: number): IAutoMovieSweepSection.IPoint => points[((k % m) + m) % m]!;
  if (section.type === "bspline") {
    if (m < 3) throw new Error("B-spline section needs at least three control points");
    return {
      segments: m,
      point: (t: number): IAutoMovieSweepSection.IPoint => {
        const x: number = (t - Math.floor(t)) * m;
        const i: number = Math.min(m - 1, Math.floor(x));
        const s: number = x - i;
        const w: number[] = [
          (1 - s) ** 3 / 6,
          (3 * s ** 3 - 6 * s ** 2 + 4) / 6,
          (-3 * s ** 3 + 3 * s ** 2 + 3 * s + 1) / 6,
          s ** 3 / 6,
        ];
        const p: IAutoMovieSweepSection.IPoint[] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
        return {
          x: w.reduce((sum: number, wk: number, k: number): number => sum + wk * p[k]!.x, 0),
          y: w.reduce((sum: number, wk: number, k: number): number => sum + wk * p[k]!.y, 0),
        };
      },
    };
  }
  if (m < 3 || m % 3 !== 0)
    throw new Error("Bezier section needs a positive multiple of three points");
  const segments: number = m / 3;
  return {
    segments,
    point: (t: number): IAutoMovieSweepSection.IPoint => {
      const x: number = (t - Math.floor(t)) * segments;
      const i: number = Math.min(segments - 1, Math.floor(x));
      const s: number = x - i;
      const r: number = 1 - s;
      const w: number[] = [r * r * r, 3 * r * r * s, 3 * r * s * s, s * s * s];
      const p: IAutoMovieSweepSection.IPoint[] = [at(3 * i), at(3 * i + 1), at(3 * i + 2), at(3 * i + 3)];
      return {
        x: w.reduce((sum: number, wk: number, k: number): number => sum + wk * p[k]!.x, 0),
        y: w.reduce((sum: number, wk: number, k: number): number => sum + wk * p[k]!.y, 0),
      };
    },
  };
};
