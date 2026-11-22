import type { IAutoMovieMotionHumanKneel } from "../everyday/IAutoMovieMotionHumanKneel";
import type { IAutoMovieMotionHumanRise } from "../everyday/IAutoMovieMotionHumanRise";
import type { IAutoMovieMotionHumanSit } from "../everyday/IAutoMovieMotionHumanSit";

/**
 * The seated postures and their transitions: sitting down, rising and kneeling.
 *
 * @template Chain The chain every method returns; the chain implements this interface.
 * @evidence contracts/development/common.md#meaningful-documentation States the family's shared model and what its methods have in common.
 * @evidence contracts/development/design.md#principled-representation One method per law of the Seat family, each taking the law's own parameter type.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The Seat laws and nothing the other families own.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each method takes the existing parameter type of its law; nothing is redefined.
 */
export interface IAutoMovieMotionHumanSeat<Chain> {
  /**
   * Sitting down on a chair, bench or stool from standing in front of it: the body's seat socket is lowered onto the seat while the trunk leans forward and the feet stay where they stand.
   *
   * @param params The `balance`, `seat`, `back`, `seconds`, `legs` and `manner` of `IAutoMovieMotionHumanSit.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanSeat.sit is provided by the chain that implements IAutoMovieMotionHumanSeat.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanSeat.sit is provided by the chain that implements IAutoMovieMotionHumanSeat.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanSeat.sit is provided by the chain that implements IAutoMovieMotionHumanSeat.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanSeat.sit is provided by the chain that implements IAutoMovieMotionHumanSeat.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanSeat.sit is provided by the chain that implements IAutoMovieMotionHumanSeat.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanSeat.sit is provided by the chain that implements IAutoMovieMotionHumanSeat.
   */
  sit(params: IAutoMovieMotionHumanSeat.ISit, anchor?: string): Chain;

  /**
   * Standing up from a seat, in the four phases of sit-to-stand (Schenkman, Berger, Riley, Mann and Hodge 1990, Phys Ther 70:638): flexion momentum, where the trunk flexes forward while the seat still bears the weight; momentum transfer at seat-off, where the hips leave the seat and the body moves forward over the feet; extension of the hips and knees; and stabilisation.
   *
   * @param params The `balance`, `to` and `manner` of `IAutoMovieMotionHumanRise.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanSeat.rise is provided by the chain that implements IAutoMovieMotionHumanSeat.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanSeat.rise is provided by the chain that implements IAutoMovieMotionHumanSeat.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanSeat.rise is provided by the chain that implements IAutoMovieMotionHumanSeat.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanSeat.rise is provided by the chain that implements IAutoMovieMotionHumanSeat.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanSeat.rise is provided by the chain that implements IAutoMovieMotionHumanSeat.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanSeat.rise is provided by the chain that implements IAutoMovieMotionHumanSeat.
   */
  rise(params: IAutoMovieMotionHumanSeat.IRise, anchor?: string): Chain;

  /**
   * Kneeling from standing: on one knee (half kneel), on both knees upright, or sitting back on the heels, held, then rising the way it went down.
   *
   * @param params The `balance`, `kind`, `knee`, `hold`, `rise`, `at` and `manner` of `IAutoMovieMotionHumanKneel.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanSeat.kneel is provided by the chain that implements IAutoMovieMotionHumanSeat.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanSeat.kneel is provided by the chain that implements IAutoMovieMotionHumanSeat.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanSeat.kneel is provided by the chain that implements IAutoMovieMotionHumanSeat.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanSeat.kneel is provided by the chain that implements IAutoMovieMotionHumanSeat.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanSeat.kneel is provided by the chain that implements IAutoMovieMotionHumanSeat.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanSeat.kneel is provided by the chain that implements IAutoMovieMotionHumanSeat.
   */
  kneel(params: IAutoMovieMotionHumanSeat.IKneel, anchor?: string): Chain;
}

/**
 * The parameter types of the Seat methods.
 */
export namespace IAutoMovieMotionHumanSeat {
  /**
   * The parameters of `sit`: `IAutoMovieMotionHumanSit.IParams`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanSit.IParams`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanSit.IParams` owns the shape; the alias serves `sit` of this family, naming its parameters in the family namespace without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type ISit = IAutoMovieMotionHumanSit.IParams;

  /**
   * The parameters of `rise`: `IAutoMovieMotionHumanRise.IParams`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanRise.IParams`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanRise.IParams` owns the shape; the alias serves `rise` of this family, naming its parameters in the family namespace without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type IRise = IAutoMovieMotionHumanRise.IParams;

  /**
   * The parameters of `kneel`: `IAutoMovieMotionHumanKneel.IParams`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanKneel.IParams`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanKneel.IParams` owns the shape; the alias serves `kneel` of this family, naming its parameters in the family namespace without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type IKneel = IAutoMovieMotionHumanKneel.IParams;
}
