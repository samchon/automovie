import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieFormationMotionState } from "./IAutoMovieFormationMotionState";
import type { IAutoMovieFormationSlotState } from "./IAutoMovieFormationSlotState";

/**
 * Data and callback contracts shared by the PlaceFormationSlot operations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Compose a unit's cue and one member's own cue into that member's placement. Member documentation states the supplied records, units and absence meanings used by placeFormationSlot.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Unit and member cues remain separate so the common placement law composes their transforms once; input numbers do not independently prove finite admitted samples.
 * @evidence contracts/development/design.md#principled-representation position and anchor are world-metre points, facingDeg and baseFacingDeg are degree headings, and unit/member retain distinct sampled motion states.
 * @evidence contracts/development/design.md#minimal-and-owned-surface interface owns IAutoMoviePlaceFormationSlot, used by placeFormationSlot. Its IProps members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
 */
export namespace IAutoMoviePlaceFormationSlot {
  /**
   * Compose a unit's cue and one member's own cue into that member's placement.
   *
   * One owner for the whole composition, because four consumers ask this question
   * and a private copy in any of them is how a review frame comes to disagree
   * with the gate that passed it. The unit's cue places the member exactly as it
   * always did; the member's own cue then displaces and turns it inside the
   * unit.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Compose a unit's cue and one member's own cue into that member's placement. Member documentation states the supplied records, units and absence meanings used by placeFormationSlot.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Unit and member cues remain separate so the common placement law composes their transforms once; input numbers do not independently prove finite admitted samples.
   * @evidence contracts/development/design.md#principled-representation position and anchor are world-metre points, facingDeg and baseFacingDeg are degree headings, and unit/member retain distinct sampled motion states.
   * @evidence contracts/development/design.md#minimal-and-owned-surface interface owns IAutoMoviePlaceFormationSlot.IProps, used by placeFormationSlot. Its position, facingDeg, anchor, baseFacingDeg, unit, member members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
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
