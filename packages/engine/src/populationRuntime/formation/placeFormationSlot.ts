import {
  type IAutoMovieFormationSlotPlacement,
  type IAutoMoviePlaceFormationSlot,
  IAutoMovieVector3,
} from "@automovie/interface";

import { rotateFormationLocalOffset } from "./rotateFormationLocalOffset";
import { transformFormationPoint } from "./transformFormationPoint";

/**
 * Compose a unit's cue and one member's own cue into that member's placement.
 *
 * One owner for the whole composition, because four consumers ask this question
 * and a private copy in any of them is how a review frame comes to disagree
 * with the gate that passed it. The unit's cue places the member exactly as it
 * always did; the member's own cue then displaces and turns it inside the
 * unit.
 */
export function placeFormationSlot(
  props: IAutoMoviePlaceFormationSlot.IProps,
): IAutoMovieFormationSlotPlacement {
  const placed: IAutoMovieVector3 = transformFormationPoint(
    props.position,
    props.anchor,
    props.unit,
    props.baseFacingDeg,
  );
  const offset: IAutoMovieVector3 = rotateFormationLocalOffset(
    props.member.offset,
    props.baseFacingDeg + props.unit.facingOffsetDeg,
  );
  return {
    present: props.member.present,
    position: {
      x: placed.x + offset.x,
      y: placed.y + offset.y,
      z: placed.z + offset.z,
    },
    facingDeg:
      props.facingDeg +
      props.unit.facingOffsetDeg +
      props.member.facingOffsetDeg,
  };
}
