import {
  IAutoMovieFormationMotionState,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "./math/Quaternion";
import { Vector3 } from "./math/Vector3";
import { transformFormationPoint } from "./transformFormationPoint";

/** World up, the axis every formation heading turns about. */
const UP: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };

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
 * formation state by {@link transformFormationPoint}, plus
 * `source.translation - base.translation`, and rotation is a yaw of
 * `baseFacingDeg + motion.facingOffsetDeg` degrees about +Y applied after
 * `inverse(base.rotation) * source.rotation`. The authored displacement is
 * added in world axes, so it is neither turned by the formation's facing nor
 * scaled by its spacing. Units are metres and degrees. Geometry measurement
 * and the viewer's instanced formation both place heroes through here.
 *
 * @param base Builder-owned hero slot transform in the designed formation.
 * @param source Authored node transform at the sampled time.
 * @param anchor Formation anchor the slot is laid out around.
 * @param motion Sampled formation state: translation, facing offset and spacing scale.
 * @param baseFacingDeg Designed formation heading in degrees, default 0.
 * @returns A new world transform for the promoted hero.
 *
 * @evidence contracts/common.md#principled-implementation Quaternion composition applies the relative authored rotation `inverse(base) * source` and then the formation yaw, which is how a rigid child keeps its offset from a turning parent; the slot position uses the same formation point map as every other member, and the authored displacement is added untransformed by design, as documented.
 * @evidence contracts/common.md#clear-and-simple-design One function owns hero composition, shared by geometry measurement and the viewer, and delegates the formation point map to `transformFormationPoint` instead of restating it.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No hero, formation or heading is special-cased; scale passes through from the source because the formation contract leaves it source-owned.
 * @evidence contracts/common.md#meaningful-documentation The documentation states the exact translation and rotation formulas, the frame the displacement is added in, units, scale ownership, the callers, and each parameter's role.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Constant time, one point map and three quaternion products, with no algorithm to choose.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure per-sample composition that coordinates no work across calls; callers sample once per frame and hero.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Allocates only the returned transform and its three components; nothing outlives the call.
 */
export const composeFormationHeroTransform = (
  base: IAutoMovieTransform,
  source: IAutoMovieTransform,
  anchor: IAutoMovieVector3,
  motion: IAutoMovieFormationMotionState,
  baseFacingDeg: number = 0,
): IAutoMovieTransform => ({
  translation: Vector3.add(
    transformFormationPoint(base.translation, anchor, motion, baseFacingDeg),
    Vector3.subtract(source.translation, base.translation),
  ),
  rotation: Quaternion.multiply(
    Quaternion.fromAxisAngle(UP, baseFacingDeg + motion.facingOffsetDeg),
    Quaternion.multiply(Quaternion.inverse(base.rotation), source.rotation),
  ),
  scale: { ...source.scale },
});
