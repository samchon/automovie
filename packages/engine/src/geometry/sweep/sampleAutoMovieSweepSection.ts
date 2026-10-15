import { IAutoMovieSweepSection } from "./IAutoMovieSweepSection";
import { interpolateAutoMovieSpline } from "./interpolateAutoMovieSpline";
import { parameterizeAutoMovieSweepSection } from "./parameterizeAutoMovieSweepSection";

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
 * spline, `interpolateAutoMovieSpline`. A superellipse centred on its origin is read in
 * closed form: in the quadrant holding the angle, with that quadrant's
 * half-axes `a` along `x` and `b` along `y` and exponent `n`, the curve is
 * `|x / a|^n + |y / b|^n = 1`, so the radius is
 * `(|cos a / a|^n + |sin a / b|^n)^(-1/n)`, and it is star-shaped and
 * counterclockwise by construction. Any other curve is first walked at 64 points per
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
 * @evidence contracts/performance.md#efficient-algorithms A centred superellipse costs O(C) closed-form radii. Otherwise, for S curve segments and C angles: O(64 S) for the walk and O(C (log S + 40)) for bracketing and bisection; a radial section costs O(C) after its O(m) interpolant.
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
        throw new Error(
          `radial section radius ${k} must be positive and finite`,
        );
    });
    const radius: (angle: number) => number = interpolateAutoMovieSpline({
      knots: section.radii.map(
        (_: number, k: number): number => (2 * Math.PI * k) / m,
      ),
      values: section.radii,
      period: 2 * Math.PI,
    });
    return angles.map(radius);
  }
  const curve: {
    point: (t: number) => IAutoMovieSweepSection.IPoint;
    segments: number;
  } = parameterizeAutoMovieSweepSection(section);
  if (
    section.type === "superellipse" &&
    (section.centre?.x ?? 0) === 0 &&
    (section.centre?.y ?? 0) === 0
  ) {
    // a centred superellipse's quadrant is |x / a|^n + |y / b|^n = 1, so its polar radius is closed-form
    const half: number[] = [
      section.right,
      section.up,
      section.left,
      section.down,
    ];
    return angles.map((angle: number): number => {
      const q: number = Math.min(3, Math.floor(angle / (Math.PI / 2)));
      const n: number = section.exponents[q]!;
      const a: number = half[q % 2 === 0 ? q : (q + 1) % 4]!;
      const b: number = half[q % 2 === 0 ? q + 1 : q]!;
      return (
        (Math.abs(Math.cos(angle) / a) ** n +
          Math.abs(Math.sin(angle) / b) ** n) **
        (-1 / n)
      );
    });
  }
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
    if (Math.hypot(p.x, p.y) === 0)
      throw new Error("section curve passes through its origin");
    const raw: number = Math.atan2(p.y, p.x);
    let phi: number = raw;
    if (i > 0) {
      let step: number = raw - previousRaw;
      step -= 2 * Math.PI * Math.round(step / (2 * Math.PI));
      if (!(step > 0))
        throw new Error(
          "section curve must be star-shaped about its origin and counterclockwise",
        );
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
    const goal: number =
      target + 2 * Math.PI * Math.ceil((phis[0]! - target) / (2 * Math.PI));
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
