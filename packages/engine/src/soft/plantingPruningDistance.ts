import {
  IAutoMoviePruningEnvelope,
  IAutoMovieVector3,
} from "@automovie/interface";

/** Find the forward distance where an inside-base unit-axis segment leaves an authored box or sphere, or null when the exit is not before the segment end.
 *
 * @evidence contracts/common.md#principled-implementation A box uses the nearest positive-facing slab boundary and a sphere its quadratic outward root; inside base, unit axis and admitted envelope are caller premises. Direct-square and root cancellation limitations remain for extreme binary64 inputs.
 * @evidence contracts/common.md#clear-and-simple-design One analytic exit owner serves all growth levels without sampled clipping or a renderer-specific pruning interpretation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Parallel box axes are skipped under the declared zero component; null means no detected cut before the requested length, not proof that arbitrary malformed or nonfinite geometry stayed inside.
 * @evidence contracts/common.md#meaningful-documentation States metre exit distance, inside/unit premises, endpoint exclusion and numeric limits.
 * @evidence contracts/performance.md#efficient-algorithms A box checks three slabs and a sphere solves one scalar quadratic, so work and temporary storage are constant.
 * @evidence contracts/performance.md#reuse-equivalent-work The authored envelope is shared across branch calls but each base/axis/length requires a fresh exit calculation; no clipping cache assumes equivalence of those inputs.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a scalar/null result survives; short per-axis arrays are temporary and no branch, envelope or render handle is retained.
 */
export const plantingPruningDistance: (
  envelope: IAutoMoviePruningEnvelope,
  base: IAutoMovieVector3,
  axis: IAutoMovieVector3,
  length: number,
) => number | null = (
  envelope: IAutoMoviePruningEnvelope,
  base: IAutoMovieVector3,
  axis: IAutoMovieVector3,
  length: number,
): number | null => {
  if (envelope.kind === "none") return null;
  if (envelope.kind === "box") {
    let exit: number = Infinity;
    const low: number[] = [envelope.min.x, envelope.min.y, envelope.min.z];
    const high: number[] = [envelope.max.x, envelope.max.y, envelope.max.z];
    const from: number[] = [base.x, base.y, base.z];
    const direction: number[] = [axis.x, axis.y, axis.z];
    for (let at: number = 0; at < 3; ++at) {
      if (direction[at] === 0) continue;
      const bound: number = direction[at] > 0 ? high[at] : low[at];
      const distance: number = (bound - from[at]) / direction[at];
      if (distance < exit) exit = distance;
    }
    return exit < length ? exit : null;
  }
  const ox: number = base.x - envelope.center.x;
  const oy: number = base.y - envelope.center.y;
  const oz: number = base.z - envelope.center.z;
  const b: number = ox * axis.x + oy * axis.y + oz * axis.z;
  const c: number =
    ox * ox + oy * oy + oz * oz - envelope.radius * envelope.radius;
  const exit: number = -b + Math.sqrt(b * b - c);
  return exit < length ? exit : null;
};
