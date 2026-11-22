/**
 * A polo stroke from the saddle. The ball leaves the mallet at 20 m/s unless `speed` says otherwise, and the trunk leans out over the side by at most 45 degrees by default.
 *
 * @template Chain The chain every method returns; the chain implements this interface.
 * @evidence contracts/development/common.md#meaningful-documentation States the family's shared model and what its methods have in common.
 * @evidence contracts/development/design.md#principled-representation One method per law of the Polo family, each taking the law's own parameter type.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The Polo laws and nothing the other families own.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each method takes the existing parameter type of its law; nothing is redefined.
 */
export interface IAutoMovieMotionHumanPolo<Chain> {
  /**
   * A polo stroke from the saddle: the rider leans by `lean` and swings the mallet on the given side and stroke through the ball at `contact`; the ball leaves the mallet at `speed`, 20 m/s when absent.
   *
   * @param params The `on`, `frame`, `mallet`, `ball`, `side`, `stroke`, `contact`, `lean` and `speed` of `IAutoMovieMotionHumanPolo`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanPolo.polo is provided by the chain that implements IAutoMovieMotionHumanPolo.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanPolo.polo is provided by the chain that implements IAutoMovieMotionHumanPolo.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanPolo.polo is provided by the chain that implements IAutoMovieMotionHumanPolo.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanPolo.polo is provided by the chain that implements IAutoMovieMotionHumanPolo.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanPolo.polo is provided by the chain that implements IAutoMovieMotionHumanPolo.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanPolo.polo is provided by the chain that implements IAutoMovieMotionHumanPolo.
   */
  polo(params: IAutoMovieMotionHumanPolo.IPolo, anchor?: string): Chain;
}

/**
 * The parameter types of the Polo methods.
 */
export namespace IAutoMovieMotionHumanPolo {}

export namespace IAutoMovieMotionHumanPolo {
  /**
   * A polo stroke from the saddle (#3955): the rider, holding a mallet in the right hand and the reins in the left, rises in the stirrups, leans out over the offside or the nearside and swings the mallet through a ball on the ground, forehand or backhand, the take-away, the top of the backswing and the contact timed by the author, then settles back into the saddle.
   *
   * @evidence contracts/development/common.md#meaningful-documentation on: The carrier's subject id. frame: The carrier contact the rider sits on. mallet: The held mallet's subject id. ball: The ball's subject id. side: The horse's side the stroke is made on. stroke: Forehand or backhand. contact: Seconds into the act the head meets the ball. lean: The trunk's lean out over the side, degrees. speed: The ball's speed off the mallet, metres per second.
   * @evidence contracts/development/design.md#principled-representation Closed side and stroke literals, seconds, degrees and a speed, and subject ids.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The parameters `HumanPolo` reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The ball's place is the ball prop's own at the contact.
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

    /** The horse's side the stroke is made on: the offside, its right, or the nearside, its left. */
    side: IAutoMovieMotionHumanPolo.Side;

    /** Forehand, the head swung forward through the ball, or backhand, swung back through it. */
    stroke: IAutoMovieMotionHumanPolo.Stroke;

    /** Seconds into the act the head meets the ball; at least the lean-in, take-away and downswing. */
    contact: number;

    /** The most the trunk may lean out over the side, degrees, more than 0 and at most 45; the stroke leans as far as brings the right shoulder over the ball's line. 45 when absent. */
    lean?: number;

    /** The ball's speed off the mallet, metres per second; 20 when absent. */
    speed?: number;
  }
}
export namespace IAutoMovieMotionHumanPolo {
  /**
   * The horse's side a stroke is made on: `offside`, its right, or `nearside`, its left.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the horse's two sides in polo terms and which side each is.
   * @evidence contracts/development/design.md#principled-representation A closed union of the horse's sides, named as polo names them rather than as the rider's left and right.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The stroke's `side` member reads it and `HumanPolo` branches on it.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts One literal per side, with no optional fields to combine.
   */
  export type Side = "offside" | "nearside";

  /**
   * A stroke: `forehand`, swung forward through the ball, or `backhand`, swung back through it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the two strokes and the swing direction of each.
   * @evidence contracts/development/design.md#principled-representation A closed union of the forehand and backhand swings through the ball.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The stroke's `stroke` member reads it and `HumanPolo` branches on it.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts One literal per stroke, with no optional fields to combine.
   */
  export type Stroke = "forehand" | "backhand";
}
