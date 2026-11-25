import type { IAutoMovieMotionHumanCarried } from "../lexicon/IAutoMovieMotionHumanCarried";
import type { IAutoMovieMotionHumanCarriedLift } from "../lexicon/IAutoMovieMotionHumanCarriedLift";

/**
 * Carrying a person: the carry and its lift. An infant held is
 * `IAutoMovieMotionHumanCare.holdInfant`.
 *
 * A method here is a method of `HumanChain` when its name is in
 * `AutoMovieMotionHumanActionName`. Any other member is a registered law or
 * row: pass it in `laws: [...]` to the performance, taking it from
 * `AutoMovieMotionHumanCarryPerson` or from the row namespace of the family,
 * and append it with `chain.registered("<name>", params)`. A member that is a
 * function, a reader or a layer says so in its own comment.
 *
 * @template Chain The chain every method returns; the chain implements this
 *   interface.
 */
export interface IAutoMovieMotionHumanCarryPerson<Chain> {
  /**
   * Being carried by another person: on the back, in the arms or over a
   * shoulder.
   *
   * Registered law: `registered("carryPerson", params)`; not a chain method.
   *
   * @param params The `partner`, `on` and `hold` of
   *   `IAutoMovieMotionHumanCarried.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  carryPerson(
    params: IAutoMovieMotionHumanCarried.IParams,
    anchor?: string,
  ): Chain;

  /**
   * The lift into a carry and the set-down out of it: the carried body leaves
   * the posture it was entered in for the carry's over the first `lift`
   * seconds, and over the last `setDown` seconds comes down to stand where the
   * carrier has brought it.
   *
   * Registered law: `registered("carriedLift", params)`; not a chain method.
   *
   * @param params The `lift` and `setDown` of
   *   `IAutoMovieMotionHumanCarriedLift.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  carriedLift(
    params: IAutoMovieMotionHumanCarriedLift.IParams,
    anchor?: string,
  ): Chain;
}
