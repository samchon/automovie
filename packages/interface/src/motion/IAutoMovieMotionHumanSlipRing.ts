import type { AutoMovieHumanSide } from "../human/AutoMovieHumanSide";

/**
 * Slip a ring onto a partner's finger: the partner presents a hand, the
 * dresser's other hand holds it from below, and the hand that holds the ring
 * brings its hole onto the fingertip and slides it along the finger to its
 * base, where it is worn on the finger's proximal bone from then on and the
 * dresser lets go.
 */
export interface IAutoMovieMotionHumanSlipRing {
  /**
   * The ring's scene subject, held at entry in the dresser's ring hand, with a
   * `wear` socket whose `+Y` is its hole's axis.
   */
  prop: string;

  /** The performer the ring is put on, who presents the hand first. */
  partner: string;

  /** The partner's hand the ring goes on; the left when absent. */
  hand?: AutoMovieHumanSide;

  /** The finger; the ring finger when absent. */
  finger?: IAutoMovieMotionHumanSlipRing.Finger;

  /**
   * The dresser's hand that holds the ring; the right when absent. The other
   * hand holds the partner's hand.
   */
  side?: AutoMovieHumanSide;
}

/** Companion types of {@link IAutoMovieMotionHumanSlipRing}. */
export namespace IAutoMovieMotionHumanSlipRing {
  /** The fingers a ring is worn on. */
  export type Finger = "index" | "middle" | "ring" | "little";
}
