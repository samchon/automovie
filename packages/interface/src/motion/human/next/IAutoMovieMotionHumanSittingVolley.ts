import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";

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
   */
  sittingVolley(
    params: IAutoMovieMotionHumanSittingVolley.ISittingVolley,
    anchor?: string,
  ): Chain;
}

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
    hand: AutoMovieHumanSide;

    /** World location of the intended forearm-platform midpoint, in metres. */
    target: IAutoMovieVector3;
  }
}
