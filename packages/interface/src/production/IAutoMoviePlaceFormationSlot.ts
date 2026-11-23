import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieFormationMotionState } from "./IAutoMovieFormationMotionState";
import type { IAutoMovieFormationSlotState } from "./IAutoMovieFormationSlotState";

/** Data and callback contracts shared by the PlaceFormationSlot operations. */
export namespace IAutoMoviePlaceFormationSlot {
  /**
   * Compose a unit's cue and one member's own cue into that member's placement.
   *
   * One owner for the whole composition, because four consumers ask this
   * question and a private copy in any of them is how a review frame comes to
   * disagree with the gate that passed it. The unit's cue places the member
   * exactly as it always did; the member's own cue then displaces and turns it
   * inside the unit.
   */
  export type IProps = {
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
  };
}
