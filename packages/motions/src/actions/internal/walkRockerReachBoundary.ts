import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

/*
 * Prepare the intersection of a rigid ankle's pitch orbit and the leg's reach
 * sphere.
 * Parameter ankle: The rigid, single-axis ankle orbit, metres, evaluated at signed
 * degrees.
 * Parameter reach: The measured maximum hip-to-ankle span, metres.
 * Returns: The last reachable pitch on the original bisection lattice, or
 * undefined when the original bracket is required.
 */
export function walkRockerReachBoundary(
  ankle: (pitch: number) => IAutoMovieVector3,
  reach: number,
): ReachBoundary {
  // The ankle reader may overwrite its return record on its next call.
  const zero: IAutoMovieVector3 = { ...ankle(0) };
  const plus: IAutoMovieVector3 = { ...ankle(90) };
  const minus: IAutoMovieVector3 = { ...ankle(-90) };
  const center: IAutoMovieVector3 = Vector3.lerp(minus, plus, 0.5);
  const cosine: IAutoMovieVector3 = Vector3.subtract(zero, center);
  const sine: IAutoMovieVector3 = Vector3.subtract(plus, center);
  const orbitSquared: number = Vector3.dot(cosine, cosine);
  return (
    hip: IAutoMovieVector3,
    low: number,
    high: number,
    tolerance: number,
  ): number | undefined => {
    const width: number = high - low;
    if (!(width > tolerance && width < 180)) return undefined;
    const delta: IAutoMovieVector3 = Vector3.subtract(center, hip);
    const cosTerm: number = 2 * Vector3.dot(delta, cosine);
    const sinTerm: number = 2 * Vector3.dot(delta, sine);
    const level: number =
      (reach * reach - Vector3.dot(delta, delta) - orbitSquared) /
      Math.hypot(cosTerm, sinTerm);
    if (!(level > -1 && level < 1)) return undefined;

    // cos(pitch - phase) rises to one on the negative side of its crest.
    const crossing: number =
      (Math.atan2(sinTerm, cosTerm) - Math.acos(level)) * DEGREES;
    const inside: number = crossing + 360 * Math.ceil((low - crossing) / 360);
    if (!(inside >= low && inside <= high)) return undefined;
    const steps: number = 2 ** Math.ceil(Math.log2(width / tolerance));
    const quantum: number = width / steps;
    const index: number = Math.min(
      steps - 1,
      Math.floor((inside - low) / quantum),
    );
    const candidate: number = low + index * quantum;
    return Vector3.distance(ankle(candidate), hip) <= reach &&
      Vector3.distance(ankle(low + (index + 1) * quantum), hip) > reach
      ? candidate
      : undefined;
  };
}

/*
 * Degrees per radian.
 */
const DEGREES: number = 180 / Math.PI;

/*
 * Circular-ankle reach entry over a signed pitch bracket.
 */
type ReachBoundary = (
  hip: IAutoMovieVector3,
  low: number,
  high: number,
  tolerance: number,
) => number | undefined;
