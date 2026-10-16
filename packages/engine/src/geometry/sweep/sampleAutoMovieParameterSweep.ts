import { IAutoMovieSweepSurface } from "./IAutoMovieSweepSurface";

/**
 * Register a fixed-cell Cartesian section average for parameter correspondence.
 *
 * Parameter correspondence pairs the curve parameter, so an off-axis, concave
 * section or an authored origin cannot be reconstructed from a polar radius.
 * The tensor trapezoid first averages the unscaled two-dimensional shape over
 * v, then its scaled points over u, in the centre frame just as the radial
 * writer does. The u-dependent scale belongs inside that second average.
 * Direction-correspondence radius averaging remains with rigAutoMovieSweep.
 *
 * Each signed coordinate is normalized by its largest magnitude before the
 * weighted sum. This avoids overflow in the sum and preserves an ordinary
 * positive subnormal constant. A genuine cancelling mean may be the origin;
 * only a nonzero normalized result lost in multiplication is refused. Scale
 * products, positive weights and world coordinates are admitted before output
 * publication. A rejected write leaves the caller's output buffer unchanged.
 *
 * @param props The compiled unscaled surface, fixed footprint and live rig views
 * @returns The allocation-free writer in model metres
 * @throws Error for nonfinite source coordinates, invalid or unrepresentable cell reaches/weights, scale products, signed means or world coordinates; write failures preserve the output buffer.
 *
 * @evidence contracts/common.md#principled-implementation Signed Cartesian tensor-product trapezoid integration, with scale inside the u integral and magnitude-normalized weighted means. Parameter-space origin/cancellation is geometrically valid; radial positivity is not imposed.
 * @evidence contracts/common.md#clear-and-simple-design One producer is called only by the parameter branch; the original radial writer is unchanged. Scale/frame readers preserve staged girth and posed buffer ownership.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No fixture-specific behavior or polar fallback. Nonfinite data, lost positive weights and unrepresentable nonzero means/products are refused.
 * @evidence contracts/common.md#meaningful-documentation States units, correspondence, integration order, cancellation, numeric refusal and output failure effects.
 * @evidence contracts/performance.md#efficient-algorithms At registration, at most nine source shape reads; each write has at most three scale products and two short coordinate reductions, O(1) with no allocation.
 * @evidence contracts/performance.md#reuse-equivalent-work The angular averages and u scale slots are compiled once; each pose/girth pass reads the current frame/scales through the supplied views.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains at most three unscaled points, three weights/slots, two scaled work arrays and one two-coordinate mean buffer until its owning rig is released.
 */
export function sampleAutoMovieParameterSweep(props: {
  surface: IAutoMovieSweepSurface;
  u: number;
  v: number;
  cell: readonly [number, number, number, number];
  frame: number;
  scale: (u: number) => number;
  readScale: (slot: number) => number;
  frames: () => Float64Array;
}): (out: Float64Array, offset: number) => void {
  const us: Array<[number, number]> = tent(props.cell[0], props.cell[1]);
  const vs: Array<[number, number]> = tent(props.cell[2], props.cell[3]);
  const slots: Int32Array = new Int32Array(us.length);
  const xs: Float64Array = new Float64Array(us.length);
  const ys: Float64Array = new Float64Array(us.length);
  const weights: Float64Array = new Float64Array(us.length);
  const vx: Float64Array = new Float64Array(vs.length);
  const vy: Float64Array = new Float64Array(vs.length);
  const vw: Float64Array = Float64Array.from(
    vs,
    (entry: [number, number]): number => entry[1],
  );
  const mean: Float64Array = new Float64Array(2);
  for (let k: number = 0; k < us.length; k++) {
    const at: number = Math.min(1, Math.max(0, props.u + us[k]![0]));
    slots[k] = props.scale(at);
    weights[k] = us[k]![1];
    for (let j: number = 0; j < vs.length; j++) {
      const point: ReturnType<IAutoMovieSweepSurface["shape"]> =
        props.surface.shape(at, props.v + vs[j]![0]);
      vx[j] = point.x;
      vy[j] = point.y;
    }
    average(vx, vy, vw, mean);
    xs[k] = mean[0]!;
    ys[k] = mean[1]!;
  }
  const sx: Float64Array = new Float64Array(us.length);
  const sy: Float64Array = new Float64Array(us.length);
  return (out: Float64Array, offset: number): void => {
    for (let k: number = 0; k < slots.length; k++) {
      const scale: number = props.readScale(slots[k]!);
      const x: number = xs[k]! * scale,
        y: number = ys[k]! * scale;
      if (
        !(scale > 0) ||
        !Number.isFinite(scale) ||
        !Number.isFinite(x) ||
        !Number.isFinite(y) ||
        ((xs[k] !== 0 || ys[k] !== 0) && x === 0 && y === 0)
      )
        throw new Error("scaled parameter sweep sample is not representable");
      sx[k] = x;
      sy[k] = y;
    }
    average(sx, sy, weights, mean);
    const frame: Float64Array = props.frames();
    const at: number = props.frame;
    const x: number =
      frame[at]! + (frame[at + 3]! * mean[0]! + frame[at + 6]! * mean[1]!);
    const y: number =
      frame[at + 1]! + (frame[at + 4]! * mean[0]! + frame[at + 7]! * mean[1]!);
    const z: number =
      frame[at + 2]! + (frame[at + 5]! * mean[0]! + frame[at + 8]! * mean[1]!);
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z))
      throw new Error("parameter sweep world sample is not representable");
    out[offset] = x;
    out[offset + 1] = y;
    out[offset + 2] = z;
  };
}

/** Nonzero reaches carry positive representable trapezoid weights. */
function tent(below: number, above: number): Array<[number, number]> {
  if (
    !Number.isFinite(below) ||
    !Number.isFinite(above) ||
    below < 0 ||
    above < 0
  )
    throw new Error("parameter sweep cell must be finite and nonnegative");
  const total: number = below + above;
  if (total === 0) return [[0, 1]];
  if (!Number.isFinite(total))
    throw new Error("parameter sweep cell span is not representable");
  const left: number = below / total / 2,
    right: number = above / total / 2;
  if (
    (below > 0 && (left === 0 || below / 2 === 0)) ||
    (above > 0 && (right === 0 || above / 2 === 0))
  )
    throw new Error("parameter sweep cell weight is not representable");
  return [
    [-below / 2, left],
    [0, 0.5],
    [above / 2, right],
  ].filter((entry: number[]): entry is [number, number] => entry[1]! > 0);
}

/** Stable signed mean; an exact cancelling zero is valid in Cartesian space. */
function average(
  xs: Float64Array,
  ys: Float64Array,
  weights: Float64Array,
  out: Float64Array,
): void {
  let maximumX: number = 0,
    maximumY: number = 0,
    total: number = 0;
  for (let k: number = 0; k < xs.length; k++) {
    if (
      !Number.isFinite(xs[k]!) ||
      !Number.isFinite(ys[k]!) ||
      !(weights[k]! > 0) ||
      !Number.isFinite(weights[k]!)
    )
      throw new Error("parameter sweep average input is not finite");
    maximumX = Math.max(maximumX, Math.abs(xs[k]!));
    maximumY = Math.max(maximumY, Math.abs(ys[k]!));
    total += weights[k]!;
  }
  // Divide by the coordinate magnitude before applying fractional weights: an
  // ordinary positive subnormal constant then averages to itself, not zero.
  let normalizedX: number = 0,
    normalizedY: number = 0;
  for (let k: number = 0; k < xs.length; k++) {
    normalizedX += weights[k]! * (maximumX === 0 ? 0 : xs[k]! / maximumX);
    normalizedY += weights[k]! * (maximumY === 0 ? 0 : ys[k]! / maximumY);
  }
  normalizedX /= total;
  normalizedY /= total;
  const x: number = maximumX * normalizedX,
    y: number = maximumY * normalizedY;
  if (
    !Number.isFinite(x) ||
    !Number.isFinite(y) ||
    ((normalizedX !== 0 || normalizedY !== 0) && x === 0 && y === 0)
  )
    throw new Error("parameter sweep average is not representable");
  out[0] = x;
  out[1] = y;
}
