import {
  IAutoMovieCompiledFormation,
  IAutoMovieFormationBounds,
  IAutoMovieFormationMotion,
  IAutoMovieSubjectBox,
} from "@automovie/interface";

import { sampleFormationMotion } from "../sampleFormationMotion";
import { transformFormationBounds } from "../transformFormationBounds";

/**
 * The world-space box, in metres, that one formation's members occupy at a shot-local instant.
 *
 * The unit's designed bounds go through {@link transformFormationBounds} under the cue {@link sampleFormationMotion} reports at that instant, so a mass that has marched, wheeled, or closed its ranks is framed where it is. Both reads are the builder's own: the ground gate that refuses a member standing off its staged surface asks the same two functions the same way, so a gate and a camera cannot disagree about where a unit is. A time before 0 reads the unit as it stands at 0.
 *
 * The transformed slot box is then widened on X and Z by the member radius the compiler derived for LOD projection, ignored when negative, and its Y range raised by the member's own extent, because the box of slot positions is a footprint: the outermost member's body hangs over its edge and its head stands above it.
 *
 * @evidence contracts/common.md#principled-implementation Moves the exact slot bounds by the sampled cue through the builder's corner transform, then takes the Minkowski sum with each member's horizontal radius and vertical extent, which bounds every member whose body stays within that radius of its slot, the radius the compiler derives as representative for the model group.
 * @evidence contracts/common.md#clear-and-simple-design Composes the builder's `sampleFormationMotion` and `transformFormationBounds` with the member extent its caller measured, so `performShot` and `realizeShotContract` frame and grade a unit from one box.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no formation; the negative-time and negative-radius floors keep a sample on the unit's defined range rather than special-casing a caller.
 * @evidence contracts/common.md#meaningful-documentation States the frame and unit, why the cue is sampled through the builder's functions, the negative-time reading, and how and why the footprint is widened and raised.
 * @evidence contracts/performance.md#efficient-algorithms One cue sample, linear in the shot's cues with a sort of this unit's cues, plus a fixed eight-corner transform; independent of the member count.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure function of one unit at one instant; the framing passes that sample a unit repeatedly own any reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing; the caller owns the returned box.
 */
export function formationSubjectBox(props: {
  /** The unit being framed. */
  formation: IAutoMovieCompiledFormation;

  /** Every compact cue in the shot; those of other units are ignored. */
  motions: readonly IAutoMovieFormationMotion[];

  /** One member's vertical extent above its slot ({@link formationMemberExtent}). */
  member: { min: number; max: number };

  /** Shot-local seconds at which the cue is sampled. */
  seconds: number;
}): IAutoMovieSubjectBox {
  const moved: IAutoMovieFormationBounds = transformFormationBounds(
    props.formation.bounds,
    props.formation.anchor,
    sampleFormationMotion(
      props.motions,
      props.formation.id,
      Math.max(0, props.seconds),
    ),
    props.formation.facingDeg,
  );
  const pad: number = Math.max(0, props.formation.projectionRadius);
  return {
    min: {
      x: moved.min.x - pad,
      y: moved.min.y + props.member.min,
      z: moved.min.z - pad,
    },
    max: {
      x: moved.max.x + pad,
      y: moved.max.y + props.member.max,
      z: moved.max.z + pad,
    },
  };
}
