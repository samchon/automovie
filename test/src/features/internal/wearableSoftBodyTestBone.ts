import type { IAutoMovieResolvedBone } from "@automovie/engine";

/**
 * Construct the original identity-rotated bone snapshot at the supplied world x/y.
 *
 * The bone name and metre coordinates come from the test; this fixture performs no FK, clinical-angle conversion or expected cloth calculation.
 *
 * Fresh local/world identity quaternions and z=0 preserve the existing accepted and malformed-frame arrangements.
 *
 * The caller owns all returned records, with no retained rig, animation cursor, host task or foreign-method replacement.
 */
export function wearableSoftBodyTestBone(
  name: IAutoMovieResolvedBone["bone"],
  x: number,
  y: number,
): IAutoMovieResolvedBone {
  return {
    bone: name,
    localRotation: { x: 0, y: 0, z: 0, w: 1 },
    worldPosition: { x, y, z: 0 },
    worldRotation: { x: 0, y: 0, z: 0, w: 1 },
  };
}
