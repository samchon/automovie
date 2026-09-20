import { IAutoMovieFormationMotionState, IAutoMovieFormationSlotState, IAutoMovieVector3 } from "@automovie/interface";
import { transformFormationPoint } from "./transformFormationPoint";
import { IAutoMovieFormationSlotPlacement } from "./IAutoMovieFormationSlotPlacement";
import { rotateFormationLocalOffset } from "./rotateFormationLocalOffset";

/**
 * Compose a unit's cue and one member's own cue into that member's placement.
 *
 * One owner for the whole composition, because four consumers ask this question
 * and a private copy in any of them is how a review frame comes to disagree
 * with the gate that passed it. The unit's cue places the member exactly as it
 * always did; the member's own cue then displaces and turns it inside the
 * unit.
 *
 * @evidence requirements/formations/heroes-variation-and-state.md#formation-group-state Composes group placement with one member's sparse presence, offset, and facing exception into the authoritative slot result.
 * @evidence specifications/performance-motion-and-staging/formation-motion-resolution-and-budgets.md#performance-formation-member-exception-command-event Gives renderer, oracle, measurement, and validation one shared member-exception composition.
 */
export const placeFormationSlot = (props: {
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
  const placed = transformFormationPoint(
    props.position,
    props.anchor,
    props.unit,
    props.baseFacingDeg,
  );
  const offset = rotateFormationLocalOffset(
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
