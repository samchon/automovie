import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";

/**
 * Admit a relative joint rotation to Rapier's independent twist coordinates.
 * With positive quaternion w, each free coordinate is 2 atan(q.axis / w);
 * locked coordinates require a zero numerator. This projects that coordinate
 * box, rather than claiming a nearest rotation in geodesic distance. At a
 * half turn the finite Rodrigues representation stops within 1e-12 radians.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Admit a relative joint rotation to Rapier's independent twist coordinates) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Admit a relative joint rotation to Rapier's independent twist coordinates) directly over its typed inputs (`joint`, `rotation`) as nested iteration of depth 2 (for-of over ["x", "y", "z"] as const; find over joint.axes), delegating to `Math.hypot`, `Number.isFinite`, `Math.max`, `Math.abs`, `Math.atan2`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (1 throw site). Beyond structural 0, 1 and 2 the body uses the literal 1e-12, whose basis this answer does not independently establish and a reviewer must confirm.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 46 lines and 8 top-level statements that reuses `Math.hypot`, `Number.isFinite`, `Math.max`, `Math.abs`, `Math.atan2` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters. Literal caveat: 1e-12 are not independently sourced here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `joint`, `rotation`; the dominant cost is nested iteration of depth 2 (for-of over ["x", "y", "z"] as const; find over joint.axes), performed once per call with 4 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 4 allocation sites become the returned value or die with the call, so nothing grows.
 */
export function projectPhysicalJointRotation(
  joint: P.IJoint,
  rotation: P.ITransform["rotation"],
): P.ITransform["rotation"] {
  const norm: number = Math.hypot(
    rotation.x,
    rotation.y,
    rotation.z,
    rotation.w,
  );
  if (!(norm > 0) || !Number.isFinite(norm))
    throw new Error("Invalid physical joint rotation");
  const sign: number = rotation.w < 0 ? -1 : 1;
  const denominator: number = Math.max(Math.abs(rotation.w) / norm, 1e-12);
  const coordinates: { x: number; y: number; z: number; w: number } = {
    x: 0,
    y: 0,
    z: 0,
    w: 1,
  };
  for (const axis of ["x", "y", "z"] as const) {
    const range: P.IAxis | undefined = joint.axes.find(
      (candidate: P.IAxis): boolean => candidate.axis === axis,
    );
    if (!range) continue;
    const angle: number =
      2 * Math.atan2((rotation[axis] * sign) / norm, denominator);
    const admitted: number = Math.max(
      -Math.PI + 1e-12,
      Math.min(
        Math.PI - 1e-12,
        Math.max(range.minimum, Math.min(range.maximum, angle)),
      ),
    );
    coordinates[axis] = Math.tan(admitted / 2);
  }
  const length: number = Math.hypot(
    coordinates.x,
    coordinates.y,
    coordinates.z,
    1,
  );
  return {
    x: coordinates.x / length,
    y: coordinates.y / length,
    z: coordinates.z / length,
    w: 1 / length,
  };
}
