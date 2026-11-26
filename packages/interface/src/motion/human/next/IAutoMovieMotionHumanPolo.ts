/** Authoring parameters and vocabulary values for a polo stroke. */
/** The authorable parameters and vocabulary values for polo. */
export namespace IAutoMovieMotionHumanPolo {
  /**
   * A polo stroke from the saddle: the rider, holding a mallet in the right
   * hand and the reins in the left, rises in the stirrups, leans out over the
   * offside or the nearside and swings the mallet through a ball on the ground,
   * forehand or backhand, the take-away, the top of the backswing and the
   * contact timed by the author, then settles back into the saddle.
   */
  export interface IPolo {
    /** The carrier's subject id. */
    on: string;

    /** The carrier contact the rider sits on, read for its moving frame. */
    frame: string;

    /** The mallet's subject id, held in the right hand. */
    mallet: string;

    /** The ball's subject id. */
    ball: string;

    /**
     * The horse's side the stroke is made on: the offside, its right, or the
     * nearside, its left.
     */
    side: IAutoMovieMotionHumanPolo.Side;

    /**
     * Forehand, the head swung forward through the ball, or backhand, swung
     * back through it.
     */
    stroke: IAutoMovieMotionHumanPolo.Stroke;

    /**
     * Seconds into the act the head meets the ball; at least the lean-in,
     * take-away and downswing.
     */
    contact: number;

    /**
     * The most the trunk may lean out over the side, degrees, more than 0 and
     * at most 45; the stroke leans as far as brings the right shoulder over the
     * ball's line. 45 when absent.
     */
    lean?: number;

    /** The ball's speed off the mallet, metres per second; 20 when absent. */
    speed?: number;
  }
}
export namespace IAutoMovieMotionHumanPolo {
  /**
   * The horse's side a stroke is made on: `offside`, its right, or `nearside`,
   * its left.
   */
  export type Side = "offside" | "nearside";

  /**
   * A stroke: `forehand`, swung forward through the ball, or `backhand`, swung
   * back through it.
   */
  export type Stroke = "forehand" | "backhand";
}
