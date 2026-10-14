import type { IAutoMovieVector3 as IAutoMovieVector3Imported } from "@automovie/interface";

import { millimetrePoint as p } from "./millimetrePoint";
import { Point } from "./structures/Point";

/**
 * Intersect a measured camera ray with a continuous finite Z surface, in mm.
 * Moving along this ray preserves the reference image position while allowing
 * the point to sit on the actual eye surface. The supplied interval must
 * bracket a finite root; bisection handles either direction and endpoint roots.
 * The height callback must represent one continuous stable field, and origin/
 * direction must be finite in the same millimetre frame. Forty bisections are
 * a finite parameter-resolution budget, not a uniform physical error proof.
 *
 * @evidence contracts/common.md#principled-implementation A continuous stable height field's finite opposite-sign endpoint residuals bracket a root; interval bisection preserves this invariant and exact endpoint/midpoint roots return directly. Same-frame finite ray/field inputs remain caller premises and no monotonic or clinical surface is inferred.
 * @evidence contracts/common.md#clear-and-simple-design Ray evaluation and residual calculation share one local path; this standalone utility owns the bracket while surface construction/admission remains outside it.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Finite endpoints/intermediate residuals are required and sign comparison avoids product overflow/underflow changing bracket classification. The unchanged forty-step budget is numerical policy, not an expected fixture root or arbitrary anatomical tolerance.
 * @evidence contracts/common.md#meaningful-documentation Prose gives millimetres, preserved camera-ray line, continuous/stable field prerequisite, endpoint roots and finite-budget accuracy limits.
 * @evidence contracts/performance.md#efficient-algorithms Two endpoint evaluations and at most forty midpoint evaluations pay the actual callback cost; fixed vector arithmetic adds no mesh population scan of its own.
 * @evidence contracts/performance.md#reuse-equivalent-work Endpoint residuals carry into each retained bracket half and one ray formula serves all samples; a changed/effectful field is not an equivalent cached root.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the fresh point transfers and bracket scalars/local closures release; no surface/history, callback task or external handle is retained.
 */
export const intersectRayWithHeightField: (
  origin: Point,
  direction: Point,
  height: (x: number, y: number) => number,
  interval: [number, number],
) => Point = (
  origin: Point,
  direction: Point,
  height: (x: number, y: number) => number,
  interval: [number, number],
): Point => {
  const at: (t: number) => Point = (t: number): Point =>
    p(
      origin.x + direction.x * t,
      origin.y + direction.y * t,
      origin.z + direction.z * t,
    );
  const residual: (t: number) => number = (t: number): number => {
    const point: IAutoMovieVector3Imported = at(t);
    return point.z - height(point.x, point.y);
  };
  let [low, high]: [number, number] = interval;
  if (![low, high].every(Number.isFinite))
    throw new Error("A surface intersection needs finite bracket parameters.");
  let left: number = residual(low);
  const right: number = residual(high);
  if (!Number.isFinite(left) || !Number.isFinite(right))
    throw new Error("A surface intersection needs finite bracketed endpoints.");
  if (left === 0) return at(low);
  if (right === 0) return at(high);
  if (Math.sign(left) === Math.sign(right))
    throw new Error("A surface intersection needs finite bracketed endpoints.");
  const midpoint: (first: number, second: number) => number = (
    first: number,
    second: number,
  ): number => {
    const sum: number = first + second;
    return Number.isFinite(sum) ? sum / 2 : first / 2 + second / 2;
  };
  for (let i: number = 0; i < 40; i++) {
    const middle: number = midpoint(low, high);
    const value: number = residual(middle);
    if (!Number.isFinite(value))
      throw new Error("A surface intersection needs finite bracket residuals.");
    if (value === 0) return at(middle);
    if (Math.sign(left) !== Math.sign(value)) high = middle;
    else {
      low = middle;
      left = value;
    }
  }
  return at(midpoint(low, high));
};
