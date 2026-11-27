import type { IAutoMoviePhysicalJointAxis } from "@automovie/interface";

/*
 * Whether a coordinate stands on or past one of its axis's bounds, by Bullet's
 * joint-limit rows (bulletphysics/bullet3,
 * `src/BulletDynamics/Featherstone/btMultiBodyJointLimitConstraint.cpp`, lines
 * 104-116 at commit c517c434e6e017d131ba3ad97ce4ec317226a2b7, zlib licence,
 * Copyright (c) 2013 Erwin Coumans): the lower row's penetration is the
 * coordinate less its lower bound, the upper row's the upper bound less the
 * coordinate, and a row is active when its penetration is at most zero. It is
 * read at the coordinate a solve would carry the axis to.
 * Parameter declared: The free axis and its bounds.
 * Parameter q: The coordinate, radians.
 * Returns: Whether either limit row is active.
 */
export function reachesXpbdJointBound(
  declared: IAutoMoviePhysicalJointAxis,
  q: number,
): boolean {
  return q - declared.minimum <= 0 || declared.maximum - q <= 0;
}
