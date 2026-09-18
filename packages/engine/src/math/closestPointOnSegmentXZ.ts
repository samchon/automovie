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

const EPSILON = 1e-9;

const cross = (
  o: IAutoMovieVector3,
  a: IAutoMovieVector3,
  b: IAutoMovieVector3,
): number => (a.x - o.x) * (b.z - o.z) - (a.z - o.z) * (b.x - o.x);

const distanceXZ = (a: IAutoMovieVector3, b: IAutoMovieVector3): number =>
  Math.hypot(a.x - b.x, a.z - b.z);

const clamp = (value: number): number => Math.min(1, Math.max(0, value));

const dedupeXZ = (
  points: readonly IAutoMovieVector3[],
): IAutoMovieVector3[] => {
  const seen = new Set<string>();
  const out: IAutoMovieVector3[] = [];
  for (const p of points) {
    const key = `${p.x},${p.z}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(p);
  }
  return out;
};

const clamp = (value: number): number => Math.min(1, Math.max(0, value));
