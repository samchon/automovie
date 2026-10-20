import { IAutoMovieVector3 } from "@automovie/interface";

import { IAutoMovieClosestSegmentPoints } from "./IAutoMovieClosestSegmentPoints";
import { Vector3 } from "./Vector3";
import { clampAutoMovieUnitInterval } from "./clampAutoMovieUnitInterval";

/**
 * Closest witnesses on bounded segments in one metre coordinate frame.
 * Inputs are unchanged; each result owns its points. segmentSegmentDistance
 * consumes this same calculation, including its precision and failure contract.
 *
 * Minimise |r+s*u-t*v| over [0,1]^2. The four boundary minima and the minimum
 * on the clipped stationary line u.(r+s*u-t*v)=0 contain a global minimiser.
 * On that line the residual is affine: project its origin onto that residual
 * segment without dividing by |u|^2*|v|^2-(u.v)^2. This avoids cancellation and
 * the absolute parallel threshold that lost small interior closest pairs.
 * The constrained-quadratic construction follows Eberly, Robust Computation
 * of Distance Between Line Segments (2023), sections 2 and 4; here the clipped
 * stationary line is minimised by its residual segment directly.
 *
 * Local differences are scaled by their largest component before dot products.
 * Math.hypot retains tiny residual lengths without squaring them to zero.
 * Exact zero-length segments remain points. Nonfinite coordinates, overflowed
 * differences, a nonzero span whose scaled squared length underflows, or an
 * unrepresentable witness distance refuse rather than fabricate separation.
 * Binary64 witnesses still round: this is not an exact contact predicate or a
 * certified distance lower bound. Callers own their precision allowance and
 * represented-output verification.
 * Equal computed residual distances choose the lowest first-segment parameter,
 * then the lowest second parameter. Reversing a segment changes that canonical
 * orientation on a nonunique minimum; it does not change the separation.
 *
 * @see https://www.geometrictools.com/Documentation/DistanceLine3Line3.pdf (modified September 21, 2023), sections 2 and 4.
 *
 * @evidence contracts/common.md#principled-implementation Four boundary minima and a clipped stationary-line residual minimum cover the constrained segment quadratic; local scaling avoids determinant cancellation, while unrepresentable nonzero spans and witness distances refuse.
 * @evidence contracts/common.md#clear-and-simple-design One owner supplies both separation and contact witnesses to distance and collision consumers, including deterministic parameter ties.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No absolute parallel epsilon replaces interior minima; only exact zero coefficients select degeneracies.
 * @evidence contracts/common.md#meaningful-documentation Documents metres, fresh witnesses, the stationary-line construction, finite-arithmetic refusals, tie ordering and noncertified binary64 precision.
 * @evidence contracts/performance.md#efficient-algorithms Four boundary candidates and at most one stationary-line candidate use constant-dimensional arithmetic and bounded storage.
 * @evidence contracts/performance.md#reuse-equivalent-work Local differences and scaled dot products serve every candidate once; changed endpoints require a new query.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Candidate records are temporary; only two new witness points and their scalar distance escape to the caller.
 */
export const closestPointsBetweenSegments: (
  a: IAutoMovieVector3,
  b: IAutoMovieVector3,
  c: IAutoMovieVector3,
  d: IAutoMovieVector3,
) => IAutoMovieClosestSegmentPoints = (
  a: IAutoMovieVector3,
  b: IAutoMovieVector3,
  c: IAutoMovieVector3,
  d: IAutoMovieVector3,
): IAutoMovieClosestSegmentPoints => {
  const rawU: IAutoMovieVector3 = Vector3.subtract(b, a);
  const rawV: IAutoMovieVector3 = Vector3.subtract(d, c);
  const rawR: IAutoMovieVector3 = Vector3.subtract(a, c);
  const values: number[] = [a, b, c, d, rawU, rawV, rawR].flatMap(
    (p: IAutoMovieVector3): number[] => [p.x, p.y, p.z],
  );
  if (!values.every(Number.isFinite))
    throw new Error(
      "Segment proximity requires finite coordinates and differences.",
    );
  const scale: number = Math.max(
    ...[rawU, rawV, rawR].flatMap((p: IAutoMovieVector3): number[] => [
      Math.abs(p.x),
      Math.abs(p.y),
      Math.abs(p.z),
    ]),
  );
  if (scale === 0) return { pointA: { ...a }, pointB: { ...c }, distance: 0 };
  const scaled: (p: IAutoMovieVector3) => IAutoMovieVector3 = (
    p: IAutoMovieVector3,
  ): IAutoMovieVector3 => ({
    x: p.x / scale,
    y: p.y / scale,
    z: p.z / scale,
  });
  const u: IAutoMovieVector3 = scaled(rawU),
    v: IAutoMovieVector3 = scaled(rawV),
    r: IAutoMovieVector3 = scaled(rawR);
  const A: number = Vector3.dot(u, u),
    B: number = Vector3.dot(u, v),
    E: number = Vector3.dot(v, v);
  const C: number = Vector3.dot(u, r),
    F: number = Vector3.dot(v, r);
  if (
    (A === 0 && Math.hypot(rawU.x, rawU.y, rawU.z) > 0) ||
    (E === 0 && Math.hypot(rawV.x, rawV.y, rawV.z) > 0)
  )
    throw new Error(
      "Segment proximity cannot represent a nonzero scaled span.",
    );
  let s: number = 0,
    t: number = 0,
    best: number = Math.hypot(r.x, r.y, r.z);
  const offer: (alongA: number, alongB: number) => void = (
    alongA: number,
    alongB: number,
  ): void => {
    const residual: IAutoMovieVector3 = Vector3.subtract(
      Vector3.add(r, Vector3.scale(u, alongA)),
      Vector3.scale(v, alongB),
    );
    const distance: number = Math.hypot(residual.x, residual.y, residual.z);
    if (
      distance < best ||
      (distance === best && (alongA < s || (alongA === s && alongB < t)))
    ) {
      best = distance;
      s = alongA;
      t = alongB;
    }
  };
  if (E > 0) {
    offer(0, clampAutoMovieUnitInterval(F / E));
    offer(1, clampAutoMovieUnitInterval((F + B) / E));
  }
  if (A > 0) {
    offer(clampAutoMovieUnitInterval(-C / A), 0);
    offer(clampAutoMovieUnitInterval((B - C) / A), 1);
  }
  if (A > 0 && E > 0) {
    if (B === 0)
      offer(
        clampAutoMovieUnitInterval(-C / A),
        clampAutoMovieUnitInterval(F / E),
      );
    else {
      const first: number = C / B,
        last: number = (C + A) / B;
      const low: number = Math.max(0, Math.min(first, last));
      const high: number = Math.min(1, Math.max(first, last));
      if (low <= high) {
        const s0: number = clampAutoMovieUnitInterval((B * low - C) / A);
        const s1: number = clampAutoMovieUnitInterval((B * high - C) / A);
        const residual: IAutoMovieVector3 = Vector3.subtract(
          Vector3.add(r, Vector3.scale(u, s0)),
          Vector3.scale(v, low),
        );
        const delta: IAutoMovieVector3 = Vector3.subtract(
          Vector3.scale(u, s1 - s0),
          Vector3.scale(v, high - low),
        );
        const length: number = Math.hypot(delta.x, delta.y, delta.z);
        if (length > 0) {
          const unit: IAutoMovieVector3 = {
            x: delta.x / length,
            y: delta.y / length,
            z: delta.z / length,
          };
          const fraction: number = clampAutoMovieUnitInterval(
            -Vector3.dot(residual, unit) / length,
          );
          offer(s0 + fraction * (s1 - s0), low + fraction * (high - low));
        }
      }
    }
  }
  const pointA: IAutoMovieVector3 = Vector3.add(a, Vector3.scale(rawU, s));
  const pointB: IAutoMovieVector3 = Vector3.add(c, Vector3.scale(rawV, t));
  const difference: IAutoMovieVector3 = Vector3.subtract(pointA, pointB);
  const distance: number = Math.hypot(difference.x, difference.y, difference.z);
  if (!Number.isFinite(distance))
    throw new Error("Segment proximity cannot represent its witness distance.");
  return { pointA, pointB, distance };
};
