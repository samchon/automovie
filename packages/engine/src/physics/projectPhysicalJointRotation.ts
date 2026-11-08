import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";

/**
 * Admit a relative joint rotation to Rapier's independent twist coordinates.
 * With positive quaternion w, each free coordinate is 2 atan(q.axis / w);
 * locked coordinates require a zero numerator. This projects that coordinate
 * box, rather than claiming a nearest rotation in geodesic distance. At a
 * half turn the finite Rodrigues representation stops within 1e-12 radians.
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
