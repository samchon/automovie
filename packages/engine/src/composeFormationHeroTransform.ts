import {
  IAutoMovieFormationMotionState,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

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
 * Exactly: translation is the slot position carried through the sampled
 * formation state plus `source.translation - base.translation`, and rotation
 * is a yaw of `baseFacingDeg + motion.facingOffsetDeg` degrees about +Y
 * applied after `inverse(base.rotation) * source.rotation`. The authored
 * displacement is added in world axes, so it is neither turned by the
 * formation's facing nor scaled by its spacing. Units are metres and degrees.
 *
 * @param base Builder-owned hero slot transform in the designed formation.
 * @param source Authored node transform at the sampled time.
 * @param anchor Formation anchor the slot is laid out around.
 * @param motion Sampled formation state: translation, facing offset and spacing scale.
 * @param baseFacingDeg Designed formation heading in degrees, default 0.
 * @returns A new world transform for the promoted hero.
 * @evidence contracts/common.md#principled-implementation Moves the slot point with `transformFormationPoint`, the same law every member follows, then re-applies the author's offset from the slot; rotation removes the slot's own rotation from the authored one by quaternion inverse and prepends the formation yaw, which assumes `base.rotation` is a unit quaternion so its inverse is its conjugate.
 * @evidence contracts/common.md#clear-and-simple-design One pure composition shared by the viewer's instanced formation build and `measureAutoMovieGeometry`, so a hero is drawn and measured in the same place.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Adds the authored displacement unrotated and leaves scale source-owned by stated contract; a hero offset from its slot therefore does not swing with a turning formation, which is the documented choice rather than a compensation.
 * @evidence contracts/common.md#meaningful-documentation States the exact translation and rotation formulas, the unrotated displacement, the source-owned scale, the units, and what each parameter is.
 * @evidence contracts/performance.md#cost-and-resources Constant work per call, one formation point transform, two quaternion products, one inverse and one axis-angle build; callers invoke it per hero per sampled frame without caching, and the returned transform is the only allocation kept.
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
