import type { IAutoMovieMotionHumanLeadHorse } from "../lexicon/IAutoMovieMotionHumanLeadHorse";
import type { IAutoMovieMotionHumanLunge } from "../lexicon/IAutoMovieMotionHumanLunge";
import type { IAutoMovieMotionHumanMounted } from "../lexicon/IAutoMovieMotionHumanMounted";
import type { IAutoMovieMotionHumanTendHorse } from "../lexicon/IAutoMovieMotionHumanTendHorse";
import type { IAutoMovieMotionHumanUnseat } from "../lexicon/IAutoMovieMotionHumanUnseat";
import type { IAutoMovieMotionHumanRide } from "./IAutoMovieMotionHumanRide";

/**
 * Living mounts: riding a horse, handling it from the ground and leaving its saddle. The horse prop owns the carrier's contacts and course, and every method here reads them at the film second it acts.
 *
 * @template Chain The chain every method returns; the chain implements this interface.
 * @evidence contracts/development/common.md#meaningful-documentation States the family's shared model and what its methods have in common.
 * @evidence contracts/development/design.md#principled-representation One method per law of the Mount family, each taking the law's own parameter type.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The Mount laws and nothing the other families own.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each method takes the existing parameter type of its law; nothing is redefined.
 */
export interface IAutoMovieMotionHumanMount<Chain> {
  /**
   * Riding a horse: a seated person carried by a support that moves by itself, such as a horse given to the performance as a moving prop (`HumanObject.prop` with a motion).
   *
   * @param params The `on`, `seconds`, `rising`, `feet`, `placeFeet`, `seat`, `hands` and `equestrian` of `IAutoMovieMotionHumanRide.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
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

  /**
   * Leading a horse on foot: one hand takes the horse's moving lead rope, holds it while the handler walks, and lets it go, as an arm overlay over an authored walk.
   *
   * @param params The parameters of the law, `IAutoMovieMotionHumanLeadHorse`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanMount.leadHorse is provided by the chain that implements IAutoMovieMotionHumanMount.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanMount.leadHorse is provided by the chain that implements IAutoMovieMotionHumanMount.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanMount.leadHorse is provided by the chain that implements IAutoMovieMotionHumanMount.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanMount.leadHorse is provided by the chain that implements IAutoMovieMotionHumanMount.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanMount.leadHorse is provided by the chain that implements IAutoMovieMotionHumanMount.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanMount.leadHorse is provided by the chain that implements IAutoMovieMotionHumanMount.
   */
  leadHorse(
    params: IAutoMovieMotionHumanMount.ILeadHorse,
    anchor?: string,
  ): Chain;

  /**
   * Caring for a horse from the ground: one hand goes to a named place on the horse, holds there through a care task, and lets go, while the handler stands.
   *
   * @param params The parameters of the law, `IAutoMovieMotionHumanTendHorse`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanMount.tendHorse is provided by the chain that implements IAutoMovieMotionHumanMount.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanMount.tendHorse is provided by the chain that implements IAutoMovieMotionHumanMount.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanMount.tendHorse is provided by the chain that implements IAutoMovieMotionHumanMount.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanMount.tendHorse is provided by the chain that implements IAutoMovieMotionHumanMount.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanMount.tendHorse is provided by the chain that implements IAutoMovieMotionHumanMount.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanMount.tendHorse is provided by the chain that implements IAutoMovieMotionHumanMount.
   */
  tendHorse(
    params: IAutoMovieMotionHumanMount.ITendHorse,
    anchor?: string,
  ): Chain;

  /**
   * Lunging a horse from the ground: the handler stands at the circle's centre, turning on the spot to face the horse as it circles, with the lunge line in one hand and the whip in the other.
   *
   * @param params The parameters of the law, `IAutoMovieMotionHumanLunge`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanMount.lunge is provided by the chain that implements IAutoMovieMotionHumanMount.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanMount.lunge is provided by the chain that implements IAutoMovieMotionHumanMount.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanMount.lunge is provided by the chain that implements IAutoMovieMotionHumanMount.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanMount.lunge is provided by the chain that implements IAutoMovieMotionHumanMount.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanMount.lunge is provided by the chain that implements IAutoMovieMotionHumanMount.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanMount.lunge is provided by the chain that implements IAutoMovieMotionHumanMount.
   */
  lunge(params: IAutoMovieMotionHumanMount.ILunge, anchor?: string): Chain;

  /**
   * A rider leaving a moving saddle against their will: thrown, pulled down, dragged by a stirrup, stepping clear or slumped over the neck, released at an authored instant or on a hit.
   *
   * @param params The parameters of the law, `IAutoMovieMotionHumanUnseat`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanMount.unseat is provided by the chain that implements IAutoMovieMotionHumanMount.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanMount.unseat is provided by the chain that implements IAutoMovieMotionHumanMount.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanMount.unseat is provided by the chain that implements IAutoMovieMotionHumanMount.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanMount.unseat is provided by the chain that implements IAutoMovieMotionHumanMount.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanMount.unseat is provided by the chain that implements IAutoMovieMotionHumanMount.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanMount.unseat is provided by the chain that implements IAutoMovieMotionHumanMount.
   */
  unseat(params: IAutoMovieMotionHumanMount.IUnseat, anchor?: string): Chain;

  /**
   * A mounted performance on a moving carrier: an ordered list of seat figures, each planned in the frame of one of the carrier's own contacts and carried with it.
   *
   * @param params The parameters of the law, `IAutoMovieMotionHumanMounted`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanMount.mounted is provided by the chain that implements IAutoMovieMotionHumanMount.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanMount.mounted is provided by the chain that implements IAutoMovieMotionHumanMount.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanMount.mounted is provided by the chain that implements IAutoMovieMotionHumanMount.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanMount.mounted is provided by the chain that implements IAutoMovieMotionHumanMount.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanMount.mounted is provided by the chain that implements IAutoMovieMotionHumanMount.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanMount.mounted is provided by the chain that implements IAutoMovieMotionHumanMount.
   */
  mounted(params: IAutoMovieMotionHumanMount.IMounted, anchor?: string): Chain;
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

  /**
   * The parameters of `leadHorse`: `IAutoMovieMotionHumanLeadHorse`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanLeadHorse`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanLeadHorse` owns the shape; the alias serves `leadHorse` of this family, naming its parameters in the family namespace without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type ILeadHorse = IAutoMovieMotionHumanLeadHorse;

  /**
   * The parameters of `tendHorse`: `IAutoMovieMotionHumanTendHorse`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanTendHorse`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanTendHorse` owns the shape; the alias serves `tendHorse` of this family, naming its parameters in the family namespace without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type ITendHorse = IAutoMovieMotionHumanTendHorse;

  /**
   * The parameters of `lunge`: `IAutoMovieMotionHumanLunge`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanLunge`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanLunge` owns the shape; the alias serves `lunge` of this family, naming its parameters in the family namespace without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type ILunge = IAutoMovieMotionHumanLunge;

  /**
   * The parameters of `unseat`: `IAutoMovieMotionHumanUnseat`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanUnseat`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanUnseat` owns the shape; the alias serves `unseat` of this family, naming its parameters in the family namespace without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type IUnseat = IAutoMovieMotionHumanUnseat;

  /**
   * The parameters of `mounted`: `IAutoMovieMotionHumanMounted`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanMounted`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanMounted` owns the shape; the alias serves `mounted` of this family, naming its parameters in the family namespace without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type IMounted = IAutoMovieMotionHumanMounted;
}
