import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";

/**
 * Playing pose of a held bugle, with the modeled mouthpiece at the lips.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the held prop, optional holding side and the authored phase timings.
 * @evidence contracts/development/design.md#principled-representation Four phase durations describe the cue in seconds.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One prop, one side and four timing controls.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The mouthpiece is a prop affordance, so the author supplies no synthetic offset.
 */
export namespace IAutoMovieMotionHumanPlayWindInstrument {
  /** The prop, holding hand and timing of the cue. */
  export interface IParams {
    /** Subject id of a held prop with a mouthpiece socket, such as the bugle. */
    prop: string;

    /** Holding hand. The right hand when absent. */
    side?: AutoMovieHumanSide;

    /** Seconds spent at the entry pose before lifting. Zero when absent. */
    delay?: number;

    /** Seconds spent lifting to the lips. Derived from the transport distance when absent. */
    prepare?: number;

    /** Seconds to keep the mouthpiece at the lips. One second when absent. */
    seconds?: number;

    /** Seconds spent lowering to the entry pose. Uses the lift duration when absent. */
    retract?: number;
  }
}
