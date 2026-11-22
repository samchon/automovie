import type { IAutoMovieMotionHumanRide } from "../lexicon/IAutoMovieMotionHumanRide";

/**
 * Mechanism: Living mounts: riding a horse.
 *
 * @template Chain The chain every method returns; the chain implements this interface.
 * @evidence contracts/development/common.md#meaningful-documentation States the family's shared model and what its methods have in common.
 * @evidence contracts/development/design.md#principled-representation One method per law of the Mount family, each taking the law's own parameter type.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The Mount laws and nothing the other families own.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each method takes the existing parameter type of its law; nothing is redefined.
 */
export interface IAutoMovieMotionHumanMount<Chain> {
  /**
   * Riding: a seated person carried by a support that moves by itself, such as a car, a bicycle or a horse given to the performance as a moving prop (`HumanObject.prop` with a motion).
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanMount.rideHorse: Riding: a seated person carried by a support that moves by itself, such as a car, a bicycle or a horse given to the performance as a moving prop (`HumanObject.prop` with a motion).
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanMount.rideHorse is provided by the chain that implements IAutoMovieMotionHumanMount.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanMount.rideHorse is provided by the chain that implements IAutoMovieMotionHumanMount.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanMount.rideHorse is provided by the chain that implements IAutoMovieMotionHumanMount.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanMount.rideHorse is provided by the chain that implements IAutoMovieMotionHumanMount.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanMount.rideHorse is provided by the chain that implements IAutoMovieMotionHumanMount.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanMount.rideHorse is provided by the chain that implements IAutoMovieMotionHumanMount.
   */
  rideHorse(
    params: IAutoMovieMotionHumanMount.IRideHorse,
    anchor?: string,
  ): Chain;
}

/**
 * The parameter types of the Mount methods.
 */
export namespace IAutoMovieMotionHumanMount {
  /**
   * The parameters of `rideHorse`: `IAutoMovieMotionHumanRide.IParams`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanRide.IParams`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanRide.IParams` owns the shape; the alias serves `rideHorse` of this family, naming its parameters in the family namespace without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type IRideHorse = IAutoMovieMotionHumanRide.IParams;
}
