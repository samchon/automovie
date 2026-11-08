import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";

/** Shared self-contact exclusions for native filtering, goal fitting and audit. Same owners, direct joint neighbours and declared overlapping pivot regions cannot collide with themselves. */
export function isPhysicalProfilePairExcluded(
  profile: P,
  a: string,
  b: string,
): boolean {
  return (
    a === b ||
    profile.joints.some(
      (joint: P.IJoint): boolean =>
        (joint.parent === a && joint.child === b) ||
        (joint.parent === b && joint.child === a),
    ) ||
    (profile.collisionExclusions?.some(
      (pair: NonNullable<P["collisionExclusions"]>[number]): boolean =>
        (pair.a === a && pair.b === b) || (pair.a === b && pair.b === a),
    ) ??
      false)
  );
}
