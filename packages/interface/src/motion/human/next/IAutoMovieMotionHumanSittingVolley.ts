/**
 * Sitting volleyball, a rally played from the floor.
 *
 * @template Chain The chain every method returns; the chain implements this interface.
 * @evidence contracts/development/common.md#meaningful-documentation States the family's shared model and what its methods have in common.
 * @evidence contracts/development/design.md#principled-representation One method per law of the SittingVolley family, each taking the law's own parameter type.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The SittingVolley laws and nothing the other families own.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each method takes the existing parameter type of its law; nothing is redefined.
 */
export interface IAutoMovieMotionHumanSittingVolley<Chain> {
  /**
   * One seated floor shift and forearm receive for sitting volleyball, entered from an established floor seat with the athlete facing the incoming play.
   *
   * @param params The `seconds`, `lateral`, `hand` and `target` of `IAutoMovieMotionHumanSittingVolley`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanSittingVolley.sittingVolley is provided by the chain that implements IAutoMovieMotionHumanSittingVolley.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanSittingVolley.sittingVolley is provided by the chain that implements IAutoMovieMotionHumanSittingVolley.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanSittingVolley.sittingVolley is provided by the chain that implements IAutoMovieMotionHumanSittingVolley.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanSittingVolley.sittingVolley is provided by the chain that implements IAutoMovieMotionHumanSittingVolley.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanSittingVolley.sittingVolley is provided by the chain that implements IAutoMovieMotionHumanSittingVolley.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanSittingVolley.sittingVolley is provided by the chain that implements IAutoMovieMotionHumanSittingVolley.
   */
  sittingVolley(
    params: IAutoMovieMotionHumanSittingVolley.ISittingVolley,
    anchor?: string,
  ): Chain;
}

/**
 * The parameter types of the SittingVolley methods.
 */
export namespace IAutoMovieMotionHumanSittingVolley {}

export namespace IAutoMovieMotionHumanSittingVolley {
  /**
   * One seated floor shift and forearm receive for sitting volleyball, entered
   * from an established floor seat with the athlete facing the incoming play.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the travel, timing, target and supporting arm for the low receive.
   * @evidence contracts/development/design.md#principled-representation A planted palm and a court-supported pelvis give way to an independent forearm reach target on the same film clock.
   * @evidence contracts/development/design.md#minimal-and-owned-surface HumanSittingVolley consumes this record for one floor movement and receive, while the scene supplies ball travel.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The shift is expressed in metres relative to the entry heading and the receive is supplied by a world location, so no actor or court is fixed.
   */
  export interface ISittingVolley {
    /** Seconds for the floor shift and receive; the palm plants at 0.25 of it, releases at 0.55 and the receive lands at 0.8 (`HumanSittingVolley` shares, provisional). No natural value is defined: choose it for the beat (provisional, missing). */
    duration: number;

    /** Signed floor displacement in metres toward the left of entry heading. */
    lateral: number;

    /** Floor palm used to assist the shift. */
    hand: "left" | "right";

    /** World location of the intended forearm-platform midpoint, in metres. */
    target: { x: number; y: number; z: number };
  }
}
