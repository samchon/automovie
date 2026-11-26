import {
  IAutoMovieFormationBounds,
  type IAutoMovieFormationSubjectBox,
  IAutoMovieSubjectBox,
} from "@automovie/interface";

import { sampleFormationMotion } from "../../populationRuntime/formation/sampleFormationMotion";
import { transformFormationBounds } from "../../populationRuntime/formation/transformFormationBounds";

/**
 * The world-space box, in metres, that one formation's members occupy at a
 * shot-local instant.
 *
 * The unit's designed bounds go through {@link transformFormationBounds} under
 * the cue {@link sampleFormationMotion} reports at that instant, so a mass that
 * has marched, wheeled, or closed its ranks is framed where it is. Both reads
 * are the builder's own: the ground gate that refuses a member standing off its
 * staged surface asks the same two functions the same way, so a gate and a
 * camera cannot disagree about where a unit is. A time before 0 reads the unit
 * as it stands at 0.
 *
 * The transformed slot box is then widened on X and Z by the member radius the
 * compiler derived for LOD projection, ignored when negative, and its Y range
 * raised by the member's own extent, because the box of slot positions is a
 * footprint: the outermost member's body hangs over its edge and its head
 * stands above it.
 */
export function formationSubjectBox(
  props: IAutoMovieFormationSubjectBox.IProps,
): IAutoMovieSubjectBox {
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
