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
 * @evidence contracts/development/implementation.md#principled-implementation Four boundary minima and a clipped stationary-line residual minimum cover the constrained segment quadratic; local scaling avoids determinant cancellation, while unrepresentable nonzero spans and witness distances refuse.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One owner supplies both separation and contact witnesses to distance and collision consumers, including deterministic parameter ties.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No absolute parallel epsilon replaces interior minima; only exact zero coefficients select degeneracies.
 * @evidence contracts/development/common.md#meaningful-documentation Documents metres, fresh witnesses, the stationary-line construction, finite-arithmetic refusals, tie ordering and noncertified binary64 precision.
 * @evidence contracts/development/implementation.md#efficient-algorithms Four boundary candidates and at most one stationary-line candidate retain constant-dimensional arithmetic. Ordered coordinate snapshots and direct scale arguments avoid admission arrays; one private residual vector serves every candidate instead of four vector intermediates per reading. When both spans are exact points no candidate workspace or reader closure is built, while initial and final distance readings remain unchanged.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Local differences and scaled dot products serve every candidate once. One residual formula writes the synchronous query's private vector, with no changed grouping; changed endpoints require a new query and final distance still comes from the rounded world witnesses.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only two fresh witness points and their scalar distance escape. The residual scratch and scalar snapshots end with this call; input records, candidates and numerical results are never cached across calls.
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

  // Preserve the original complete coordinate read before finite admission,
  // with scalar snapshots instead of the flatMap's temporary arrays.
  const ax: number = a.x,
    ay: number = a.y,
    az: number = a.z;
  const bx: number = b.x,
    by: number = b.y,
    bz: number = b.z;
  const cx: number = c.x,
    cy: number = c.y,
    cz: number = c.z;
  const dx: number = d.x,
    dy: number = d.y,
    dz: number = d.z;
  const ux: number = rawU.x,
    uy: number = rawU.y,
    uz: number = rawU.z;
  const vx: number = rawV.x,
    vy: number = rawV.y,
    vz: number = rawV.z;
  const rx: number = rawR.x,
    ry: number = rawR.y,
    rz: number = rawR.z;
  if (
    !Number.isFinite(ax) ||
    !Number.isFinite(ay) ||
    !Number.isFinite(az) ||
    !Number.isFinite(bx) ||
    !Number.isFinite(by) ||
    !Number.isFinite(bz) ||
    !Number.isFinite(cx) ||
    !Number.isFinite(cy) ||
    !Number.isFinite(cz) ||
    !Number.isFinite(dx) ||
    !Number.isFinite(dy) ||
    !Number.isFinite(dz) ||
    !Number.isFinite(ux) ||
    !Number.isFinite(uy) ||
    !Number.isFinite(uz) ||
    !Number.isFinite(vx) ||
    !Number.isFinite(vy) ||
    !Number.isFinite(vz) ||
    !Number.isFinite(rx) ||
    !Number.isFinite(ry) ||
    !Number.isFinite(rz)
  )
    throw new Error(
      "Segment proximity requires finite coordinates and differences.",
    );
  const scale: number = Math.max(
    Math.abs(ux),
    Math.abs(uy),
    Math.abs(uz),
    Math.abs(vx),
    Math.abs(vy),
    Math.abs(vz),
    Math.abs(rx),
    Math.abs(ry),
    Math.abs(rz),
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
  if (A > 0 || E > 0) {
    const residual: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
    const readResidual: (alongA: number, alongB: number) => void = (
      alongA: number,
      alongB: number,
    ): void => {
      residual.x = r.x + u.x * alongA - v.x * alongB;
      residual.y = r.y + u.y * alongA - v.y * alongB;
      residual.z = r.z + u.z * alongA - v.z * alongB;
    };
    const offer: (alongA: number, alongB: number) => void = (
      alongA: number,
      alongB: number,
    ): void => {
      readResidual(alongA, alongB);
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
          readResidual(s0, low);
          const ds: number = s1 - s0;
          const dt: number = high - low;
          const delta: IAutoMovieVector3 = {
            x: u.x * ds - v.x * dt,
            y: u.y * ds - v.y * dt,
            z: u.z * ds - v.z * dt,
          };
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
  }
  const pointA: IAutoMovieVector3 = {
    x: a.x + rawU.x * s,
    y: a.y + rawU.y * s,
    z: a.z + rawU.z * s,
  };
  const pointB: IAutoMovieVector3 = {
    x: c.x + rawV.x * t,
    y: c.y + rawV.y * t,
    z: c.z + rawV.z * t,
  };
  const distance: number = Math.hypot(
    pointA.x - pointB.x,
    pointA.y - pointB.y,
    pointA.z - pointB.z,
  );
  if (!Number.isFinite(distance))
    throw new Error("Segment proximity cannot represent its witness distance.");
  return { pointA, pointB, distance };
};
