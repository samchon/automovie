import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Closest point to `point` on segment `start`–`end`, on the XZ plane (y=0).
 *
 * @evidence requirements/motion/contact-weight-and-support.md#motion-contact-authority-tolerance Projects a load point onto one support edge in the ground plane.
 * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-contact-phase-weight-support Projects a load point onto one support edge in the ground plane.
 */
export const closestPointOnSegmentXZ = (
  point: IAutoMovieVector3,
  start: IAutoMovieVector3,
  end: IAutoMovieVector3,
): IAutoMovieVector3 => {
  const dx = end.x - start.x;
  const dz = end.z - start.z;
  const span = Math.max(dx * dx + dz * dz, Number.EPSILON);
  const t = clamp(((point.x - start.x) * dx + (point.z - start.z) * dz) / span);
  return { x: start.x + dx * t, y: 0, z: start.z + dz * t };
};

const clamp = (value: number): number => Math.min(1, Math.max(0, value));
