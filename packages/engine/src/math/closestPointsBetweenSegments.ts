import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieClosestSegmentPoints } from "./IAutoMovieClosestSegmentPoints";
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
 * @evidence requirements/motion/contact-weight-and-support.md#motion-contact-authority-tolerance Returns paired contact witnesses and their shared separation without an absolute scale-dependent parallel cutoff.
 * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-contact-phase-weight-support Minimises the bounded contact-feature quadratic and measures the separation of the same owned witnesses used for a contact normal.
 * @author Samchon
 */
export const closestPointsBetweenSegments = (
  a: IAutoMovieVector3,
  b: IAutoMovieVector3,
  c: IAutoMovieVector3,
  d: IAutoMovieVector3,
): IAutoMovieClosestSegmentPoints => {
  const rawU = Vector3.subtract(b, a);
  const rawV = Vector3.subtract(d, c);
  const rawR = Vector3.subtract(a, c);
  const values = [a, b, c, d, rawU, rawV, rawR].flatMap((p) => [p.x, p.y, p.z]);
  if (!values.every(Number.isFinite))
    throw new Error(
      "Segment proximity requires finite coordinates and differences.",
    );
  const scale = Math.max(
    ...[rawU, rawV, rawR].flatMap((p) => [
      Math.abs(p.x),
      Math.abs(p.y),
      Math.abs(p.z),
    ]),
  );
  if (scale === 0) return { pointA: { ...a }, pointB: { ...c }, distance: 0 };
  const scaled = (p: IAutoMovieVector3): IAutoMovieVector3 => ({
    x: p.x / scale,
    y: p.y / scale,
    z: p.z / scale,
  });
  const u = scaled(rawU),
    v = scaled(rawV),
    r = scaled(rawR);
  const A = Vector3.dot(u, u),
    B = Vector3.dot(u, v),
    E = Vector3.dot(v, v);
  const C = Vector3.dot(u, r),
    F = Vector3.dot(v, r);
  if (
    (A === 0 && Math.hypot(rawU.x, rawU.y, rawU.z) > 0) ||
    (E === 0 && Math.hypot(rawV.x, rawV.y, rawV.z) > 0)
  )
    throw new Error(
      "Segment proximity cannot represent a nonzero scaled span.",
    );
  let s = 0,
    t = 0,
    best = Math.hypot(r.x, r.y, r.z);
  const offer = (alongA: number, alongB: number): void => {
    const residual = Vector3.subtract(
      Vector3.add(r, Vector3.scale(u, alongA)),
      Vector3.scale(v, alongB),
    );
    const distance = Math.hypot(residual.x, residual.y, residual.z);
    if (
      distance < best ||
      (distance === best &&
        (alongA < s || (alongA === s && alongB < t)))
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
    if (B === 0) offer(clampAutoMovieUnitInterval(-C / A), clampAutoMovieUnitInterval(F / E));
    else {
      const first = C / B,
        last = (C + A) / B;
      const low = Math.max(0, Math.min(first, last));
      const high = Math.min(1, Math.max(first, last));
      if (low <= high) {
        const s0 = clampAutoMovieUnitInterval((B * low - C) / A);
        const s1 = clampAutoMovieUnitInterval((B * high - C) / A);
        const residual = Vector3.subtract(
          Vector3.add(r, Vector3.scale(u, s0)),
          Vector3.scale(v, low),
        );
        const delta = Vector3.subtract(
          Vector3.scale(u, s1 - s0),
          Vector3.scale(v, high - low),
        );
        const length = Math.hypot(delta.x, delta.y, delta.z);
        if (length > 0) {
          const unit = {
            x: delta.x / length,
            y: delta.y / length,
            z: delta.z / length,
          };
          const fraction = clampAutoMovieUnitInterval(-Vector3.dot(residual, unit) / length);
          offer(s0 + fraction * (s1 - s0), low + fraction * (high - low));
        }
      }
    }
  }
  const pointA = Vector3.add(a, Vector3.scale(rawU, s));
  const pointB = Vector3.add(c, Vector3.scale(rawV, t));
  const difference = Vector3.subtract(pointA, pointB);
  const distance = Math.hypot(difference.x, difference.y, difference.z);
  if (!Number.isFinite(distance))
    throw new Error("Segment proximity cannot represent its witness distance.");
  return { pointA, pointB, distance };
};
