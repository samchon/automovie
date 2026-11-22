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
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanCarryPerson.carryPerson is provided by the chain that implements IAutoMovieMotionHumanCarryPerson.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanCarryPerson.carryPerson is provided by the chain that implements IAutoMovieMotionHumanCarryPerson.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanCarryPerson.carryPerson is provided by the chain that implements IAutoMovieMotionHumanCarryPerson.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanCarryPerson.carryPerson is provided by the chain that implements IAutoMovieMotionHumanCarryPerson.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanCarryPerson.carryPerson is provided by the chain that implements IAutoMovieMotionHumanCarryPerson.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanCarryPerson.carryPerson is provided by the chain that implements IAutoMovieMotionHumanCarryPerson.
   */
  carryPerson(
    params: IAutoMovieMotionHumanCarryPerson.ICarryPerson,
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
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanCarryPerson.carriedLift is provided by the chain that implements IAutoMovieMotionHumanCarryPerson.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanCarryPerson.carriedLift is provided by the chain that implements IAutoMovieMotionHumanCarryPerson.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanCarryPerson.carriedLift is provided by the chain that implements IAutoMovieMotionHumanCarryPerson.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanCarryPerson.carriedLift is provided by the chain that implements IAutoMovieMotionHumanCarryPerson.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanCarryPerson.carriedLift is provided by the chain that implements IAutoMovieMotionHumanCarryPerson.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanCarryPerson.carriedLift is provided by the chain that implements IAutoMovieMotionHumanCarryPerson.
   */
  carriedLift(
    params: IAutoMovieMotionHumanCarryPerson.ICarriedLift,
    anchor?: string,
  ): Chain;
}

/**
 * The parameter types of the CarryPerson methods.
 */
export namespace IAutoMovieMotionHumanCarryPerson {
  /**
   * The parameters of `carryPerson`: the carried law's own `IAutoMovieMotionHumanCarried.IParams`, unchanged.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method it parameterises and the law type it aliases unchanged.
   * @evidence contracts/development/design.md#principled-representation An alias: units, frames, defaults and invariants are those the law type states; the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanCarried` owns the type; the alias serves this family's `carryPerson` signature.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast, so `carryPerson` takes the type its law reads.
   */
  export type ICarryPerson = IAutoMovieMotionHumanCarried.IParams;

  /**
   * The parameters of `carriedLift`: the law's own `IAutoMovieMotionHumanCarriedLift.IParams`, unchanged.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method it parameterises and the law type it aliases unchanged.
   * @evidence contracts/development/design.md#principled-representation An alias: units, frames, defaults and invariants are those the law type states; the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanCarriedLift` owns the type; the alias serves this family's `carriedLift` signature.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast, so `carriedLift` takes the type its law reads.
   */
  export type ICarriedLift = IAutoMovieMotionHumanCarriedLift.IParams;
}
