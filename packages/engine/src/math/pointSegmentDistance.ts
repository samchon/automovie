import { IAutoMovieVector3 } from "@automovie/interface";
import { Vector3 } from "./Vector3";

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

/** Closest point on segment `[start, end]` to `point`. */
const closestPointOnSegment = (
  point: IAutoMovieVector3,
  start: IAutoMovieVector3,
  end: IAutoMovieVector3,
): IAutoMovieVector3 => {
  const segment = Vector3.subtract(end, start);
  // Guard the zero-length segment (start === end, e.g. two bones the FK
  // resolves onto the same world point): an unguarded `0/0` yields NaN, and a
  // NaN distance slips every `distance < minimum` collision test as false,
  // silently passing a real overlap. `Number.EPSILON` floors the span so t=0
  // and the closest point degrades to `start`, i.e. the exact point-to-point
  // distance. Mirrors `hull.ts`'s `closestPointOnSegmentXZ`.
  const span = Math.max(Vector3.dot(segment, segment), Number.EPSILON);
  const t = clamp01(
    Vector3.dot(Vector3.subtract(point, start), segment) / span,
  );
  return Vector3.lerp(start, end, t);
};

/**
 * Distance from `point` to segment `[start, end]`.
 *
 * @evidence requirements/motion/contact-weight-and-support.md#motion-contact-authority-tolerance Measures a contact point's shortest residual to a bounded support or collider segment.
 * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-contact-phase-weight-support Measures a contact point's shortest residual to a bounded support or collider segment.
 */
export const pointSegmentDistance = (
  point: IAutoMovieVector3,
  start: IAutoMovieVector3,
  end: IAutoMovieVector3,
): number =>
  Vector3.length(
    Vector3.subtract(point, closestPointOnSegment(point, start, end)),
  );
