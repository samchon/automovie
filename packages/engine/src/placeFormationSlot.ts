import {
  IAutoMovieFormationMotionState,
  IAutoMovieFormationSlotState,
  IAutoMovieVector3,
} from "@automovie/interface";

import { IAutoMovieFormationSlotPlacement } from "./IAutoMovieFormationSlotPlacement";
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
 *
 * @evidence contracts/common.md#principled-implementation Transform the designed point about the unit anchor using unit spacing, heading and translation, then rotate the member-local offset by the unit heading and add both heading offsets. Terrain height is inherited from the designed point rather than resampled after cue displacement.
 * @evidence contracts/common.md#clear-and-simple-design One shared composition owner serves gates, review frames and rendering; point and local-offset helpers keep coordinate conventions explicit.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No consumer gets a separate placement formula; absence is passed through as member.present, and the function does not invent ground support for moved slots.
 * @evidence contracts/common.md#meaningful-documentation Props give world metre positions, degree headings, unit/member cue ownership and the present result; terrain validation remains the final placed-world gate's responsibility.
 * @evidence contracts/performance.md#efficient-algorithms A fixed number of yaw, scale and translation operations gives O(1) work and one new placement per slot.
 * @evidence contracts/performance.md#reuse-equivalent-work The canonical formula is shared across consumers; values are recomputed from current mutable cue states rather than cached by slot identity.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Inputs are borrowed and the returned position is fresh; no cue, terrain, handle or task is retained beyond the call.
 */
export const placeFormationSlot: (props: {
  /** Designed world-space position of this member at rest. */ position: IAutoMovieVector3;
  /** Designed world-space heading of this member at rest, in degrees. */ facingDeg: number;
  /** The unit's world-space origin. */ anchor: IAutoMovieVector3;
  /** The unit's designed world-space heading in degrees. */ baseFacingDeg: number;
  /** Sampled unit-level state. */ unit: IAutoMovieFormationMotionState;
  /** Sampled member-level state. */ member: IAutoMovieFormationSlotState;
}) => IAutoMovieFormationSlotPlacement = (props: {
  /** Designed world-space position of this member at rest. */
  position: IAutoMovieVector3;
  /** Designed world-space heading of this member at rest, in degrees. */
  facingDeg: number;
  /** The unit's world-space origin. */
  anchor: IAutoMovieVector3;
  /** The unit's designed world-space heading in degrees. */
  baseFacingDeg: number;
  /** Sampled unit-level state. */
  unit: IAutoMovieFormationMotionState;
  /** Sampled member-level state. */
  member: IAutoMovieFormationSlotState;
}): IAutoMovieFormationSlotPlacement => {
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
};
