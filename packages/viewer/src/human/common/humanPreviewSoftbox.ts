/**
 * Directions toward a round light source of angular radius `halfAngle` centred on `direction`, as `count` equal-solid-angle directional samples.
 *
 * The source is sampled on its spherical cap with a golden-angle spiral:
 * the k-th of `count` directions sits at the
 * polar angle whose cap holds (k + 1/2) / `count` of the source's solid angle
 * and turns from the one before by the golden angle, so each stands for an
 * equal share of the source and together they cover it without rows. Each
 * direction keeps the length of `direction`.
 *
 * Pure: returns new arrays.
 *
 * @evidence contracts/common.md#principled-implementation Midpoints of equal solid-angle cap intervals select polar angles, golden-angle turns distribute azimuths, and a least-aligned axis supplies a stable orthonormal basis. Finite nonzero direction length, supported angle and feasible integer count are premises; positive infinite direction length passes the current gate, and tiny angles can collapse under floating rounding.
 * @evidence contracts/common.md#clear-and-simple-design The function returns numerical directions of the original length; native directional-light allocation, power division and shadow map policy remain with addHumanPreviewRig.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Sampling follows a uniform formula rather than source names or expected shadow shapes. Equal solid-angle intervals approximate an extended emitter; they do not guarantee exact penumbra widths or observed smoothness at a finite sample count.
 * @evidence contracts/common.md#meaningful-documentation The comment gives radian cap radius, midpoint indexing, equal-share interpretation and retained direction length without unobserved centimetre-scale appearance claims.
 * @evidence contracts/performance.md#efficient-algorithms Builds N direction tuples in linear time and storage; basis construction has fixed three-axis work. Count has no finite memory cap beyond the host's Array.from limits.
 * @evidence contracts/performance.md#reuse-equivalent-work One cap basis and angular extent are reused for all samples in the call. Changed direction, angle or count requires new directions; no native light cache is retained.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns N numerical arrays and owns no light or shadow map. The caller controls their retention and subsequently allocated native resource lifetime.
 */
export function humanPreviewSoftbox(
  direction: readonly [number, number, number],
  halfAngle: number,
  count: number,
): [number, number, number][] {
  const length: number = Math.hypot(...direction);
  if (!(length > 0)) throw new Error("A light direction needs a length.");
  if (!(halfAngle > 0 && halfAngle < Math.PI / 2))
    throw new Error("A source's half angle lies between 0 and a right angle.");
  if (!(Number.isInteger(count) && count >= 1))
    throw new Error("A source needs one sample or more.");
  const w: [number, number, number] = direction.map(
    (value: number): number => value / length,
  ) as [number, number, number];
  // The axis least aligned with the direction spans the cap's plane.
  const least: number = [0, 1, 2].reduce((best: number, k: number): number =>
    Math.abs(w[k]!) < Math.abs(w[best]!) ? k : best,
  );
  const axis: [number, number, number] = [0, 0, 0];
  axis[least] = 1;
  const cross: (
    a: readonly number[],
    b: readonly number[],
  ) => [number, number, number] = (
    a: readonly number[],
    b: readonly number[],
  ): [number, number, number] => [
    a[1]! * b[2]! - a[2]! * b[1]!,
    a[2]! * b[0]! - a[0]! * b[2]!,
    a[0]! * b[1]! - a[1]! * b[0]!,
  ];
  const u0: [number, number, number] = cross(w, axis);
  const norm: number = Math.hypot(...u0);
  const u: number[] = u0.map((value: number): number => value / norm);
  const v: [number, number, number] = cross(w, u);
  const golden: number = Math.PI * (3 - Math.sqrt(5));
  const cap: number = 1 - Math.cos(halfAngle);
  return Array.from(
    { length: count },
    (_: unknown, k: number): [number, number, number] => {
      const polar: number = Math.acos(1 - ((k + 0.5) / count) * cap);
      const turn: number = k * golden;
      const [s, c]: [number, number] = [Math.sin(polar), Math.cos(polar)];
      return [0, 1, 2].map(
        (axis: number): number =>
          length *
          (c * w[axis]! +
            s * (Math.cos(turn) * u[axis]! + Math.sin(turn) * v[axis]!)),
      ) as [number, number, number];
    },
  );
}
