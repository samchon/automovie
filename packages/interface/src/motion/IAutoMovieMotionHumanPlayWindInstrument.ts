import type { AutoMovieHumanSide } from "../human/AutoMovieHumanSide";

/** Playing pose of a held bugle, with the modeled mouthpiece at the lips. */
export namespace IAutoMovieMotionHumanPlayWindInstrument {
  /** The prop, holding hand and timing of the cue. */
  export interface IParams {
    /** Subject id of a held prop with a mouthpiece socket, such as the bugle. */
    prop: string;

    /** Holding hand. The right hand when absent. */
    hand?: AutoMovieHumanSide;

    /** Seconds spent at the entry pose before lifting. Zero when absent. */
    delay?: number;

    /**
     * Seconds spent lifting to the lips. Derived from the transport distance
     * when absent.
     */
    prepare?: number;

    /** Seconds to keep the mouthpiece at the lips. One second when absent. */
    hold?: number;

    /**
     * Seconds spent lowering to the entry pose. Uses the lift duration when
     * absent.
     */
    retract?: number;
  }
}
