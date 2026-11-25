/**
 * Pull a sheet or blanket up while lying, or push it off: both hands take the
 * cover's edge where it lies over the thighs and draw it up the body to the
 * chest, or take it at the chest and push it down to the thighs before sitting
 * up. The cover is a soft prop the hands grip.
 */
export interface IAutoMovieMotionHumanPullCover {
  /** The cover's scene subject: a soft prop lying over the body. */
  prop: string;

  /**
   * Push the cover off, from the chest down to the thighs, instead of pulling
   * it up.
   */
  off?: boolean;
}
