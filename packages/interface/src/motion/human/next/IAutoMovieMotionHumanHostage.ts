import type { IAutoMovieMotionHumanDisarm } from "../grappling/IAutoMovieMotionHumanDisarm";
import type { IAutoMovieMotionHumanHostageHold } from "../grappling/IAutoMovieMotionHumanHostageHold";

/**
 * A hostage scene: a hostage held by an arm and a disarm of a knife or a handgun. The hold and the disarm are authored scenes with no source (provisional).
 *
 * @template Chain The chain every method returns; the chain implements this interface.
 * @evidence contracts/development/common.md#meaningful-documentation States the family's shared model and what its methods have in common.
 * @evidence contracts/development/design.md#principled-representation One method per law of the Hostage family, each taking the law's own parameter type.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The Hostage laws and nothing the other families own.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each method takes the existing parameter type of its law; nothing is redefined.
 */
export interface IAutoMovieMotionHumanHostage<Chain> {
  /**
   * A staged disarm: the defender takes a knife or a handgun from a resisting partner, and the partner's hand gives it up.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanHostage.disarm: A staged disarm: the defender takes a knife or a handgun from a resisting partner, and the partner's hand gives it up.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanHostage.disarm is provided by the chain that implements IAutoMovieMotionHumanHostage.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanHostage.disarm is provided by the chain that implements IAutoMovieMotionHumanHostage.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanHostage.disarm is provided by the chain that implements IAutoMovieMotionHumanHostage.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanHostage.disarm is provided by the chain that implements IAutoMovieMotionHumanHostage.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanHostage.disarm is provided by the chain that implements IAutoMovieMotionHumanHostage.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanHostage.disarm is provided by the chain that implements IAutoMovieMotionHumanHostage.
   */
  disarm(params: IAutoMovieMotionHumanHostage.IDisarm, anchor?: string): Chain;

  /**
   * A hostage hold from behind: the holder's free arm lies across the hostage's chest or neck, the other hand presents a held weapon at the hostage's head or throat, and the pair walks backward together.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanHostage.hostageHold: A hostage hold from behind: the holder's free arm lies across the hostage's chest or neck, the other hand presents a held weapon at the hostage's head or throat, and the pair walks backward together.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanHostage.hostageHold is provided by the chain that implements IAutoMovieMotionHumanHostage.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanHostage.hostageHold is provided by the chain that implements IAutoMovieMotionHumanHostage.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanHostage.hostageHold is provided by the chain that implements IAutoMovieMotionHumanHostage.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanHostage.hostageHold is provided by the chain that implements IAutoMovieMotionHumanHostage.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanHostage.hostageHold is provided by the chain that implements IAutoMovieMotionHumanHostage.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanHostage.hostageHold is provided by the chain that implements IAutoMovieMotionHumanHostage.
   */
  hostageHold(
    params: IAutoMovieMotionHumanHostage.IHostageHold,
    anchor?: string,
  ): Chain;
}

/**
 * The parameter types of the Hostage methods.
 */
export namespace IAutoMovieMotionHumanHostage {
  /**
   * The parameters of `disarm`: `IAutoMovieMotionHumanDisarm.IParams`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanDisarm.IParams`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanDisarm.IParams` owns the shape; the alias serves `disarm` of this family, naming its parameters in the family namespace without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type IDisarm = IAutoMovieMotionHumanDisarm.IParams;

  /**
   * The parameters of `hostageHold`: `IAutoMovieMotionHumanHostageHold.IParams`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanHostageHold.IParams`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanHostageHold.IParams` owns the shape; the alias serves `hostageHold` of this family, naming its parameters in the family namespace without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type IHostageHold = IAutoMovieMotionHumanHostageHold.IParams;
}
