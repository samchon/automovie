/**
 * Loads carried at the sides with the arms hanging, performed over a walk
 * (`AutoMovieMotionHumanChain.over`): a farmer's walk. Each hand that holds a prop is let down
 * until its arm hangs nearly straight from the shoulder, a little out from the
 * thigh, the hand turned as it held the prop, and holds it there.
 *
 * Each wrist goes `HANG` of the arm (upper arm and forearm) below its shoulder,
 * read on the walk's posture each second, and `OUT` of the half shoulder width
 * out to the side; the arms leave their carrying pose over `SETTLE` seconds and
 * keep the walk's posture otherwise. The props stay in the hands: the law grips
 * them through its whole length and leaves them held after.
 */
export namespace IAutoMovieMotionHumanCarryHang {
  /** Parameters. */
  export interface IParams {
    /** The prop the left hand holds; that arm is left to the walk when absent. */
    left?: string;

    /** The prop the right hand holds; that arm is left to the walk when absent. */
    right?: string;

    /** Seconds the carry lasts; 3 when absent. */
    duration?: number;
  }
}
