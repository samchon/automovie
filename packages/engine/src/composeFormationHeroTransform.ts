import { IAutoMovieFormationMotionState, IAutoMovieTransform, IAutoMovieVector3 } from "@automovie/interface";
import { Quaternion } from "./math/Quaternion";
import { Vector3 } from "./math/Vector3";
import { transformFormationPoint } from "./transformFormationPoint";

/**
 * Compose a promoted hero's source-authored node transform with formation
 * placement and motion.
 *
 * Translation keeps authored node/object-motion displacement relative to the
 * builder-owned hero slot. Rotation applies the current formation facing
 * before the authored rotation relative to that slot, while scale remains
 * source-owned.
 *
 * @evidence requirements/formations/heroes-variation-and-state.md#formation-hero-overrides Preserves a promoted actor's authored translation, rotation, and scale while inheriting formation placement and motion.
 * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-hero-variation-group-state Implements the named-hero exception without returning the actor to the anonymous instance batch.
 */
export const composeFormationHeroTransform = (
  base: IAutoMovieTransform,
  source: IAutoMovieTransform,
  anchor: IAutoMovieVector3,
  motion: IAutoMovieFormationMotionState,
  baseFacingDeg = 0,
): IAutoMovieTransform => ({
  translation: Vector3.add(
    transformFormationPoint(base.translation, anchor, motion, baseFacingDeg),
    Vector3.subtract(source.translation, base.translation),
  ),
  rotation: Quaternion.multiply(
    Quaternion.fromAxisAngle(
      { x: 0, y: 1, z: 0 },
      baseFacingDeg + motion.facingOffsetDeg,
    ),
    Quaternion.multiply(Quaternion.inverse(base.rotation), source.rotation),
  ),
  scale: { ...source.scale },
});
