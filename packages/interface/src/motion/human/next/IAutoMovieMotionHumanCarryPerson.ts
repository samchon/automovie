import type { IAutoMovieMotionHumanCarried } from "../lexicon/IAutoMovieMotionHumanCarried";
import type { IAutoMovieMotionHumanCarriedLift } from "../lexicon/IAutoMovieMotionHumanCarriedLift";

/**
 * Carrying a person: the carry and its lift. An infant held is `IAutoMovieMotionHumanCare.holdInfant`.
 *
 * @template Chain The chain every method returns; the chain implements this interface.
 * @evidence contracts/development/common.md#meaningful-documentation States the family's shared model and what its methods have in common.
 * @evidence contracts/development/design.md#principled-representation One method per law of the CarryPerson family, each taking the law's own parameter type.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The CarryPerson laws and nothing the other families own.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each method takes the existing parameter type of its law; nothing is redefined.
 */
export interface IAutoMovieMotionHumanCarryPerson<Chain> {
  /**
   * Being carried by another person: on the back, in the arms or over a shoulder.
   *
   * @param params The `by`, `on` and `seconds` of `IAutoMovieMotionHumanCarried.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   */
  carryPerson(
    params: IAutoMovieMotionHumanCarried.IParams,
    anchor?: string,
  ): Chain;

  /**
   * The lift into a carry and the set-down out of it (#3349): the carried body leaves the posture it was entered in for the carry's over the first `lift` seconds, and over the last `setDown` seconds comes down to stand where the carrier has brought it.
   *
   * @param params The `lift` and `setDown` of `IAutoMovieMotionHumanCarriedLift.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   */
  carriedLift(
    params: IAutoMovieMotionHumanCarriedLift.IParams,
    anchor?: string,
  ): Chain;
}
