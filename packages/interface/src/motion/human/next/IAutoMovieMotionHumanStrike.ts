import type { IAutoMovieMotionHumanMartialArt } from "../sport/IAutoMovieMotionHumanMartialArt";
import type { IAutoMovieMotionHumanCloseStrike } from "../striking/IAutoMovieMotionHumanCloseStrike";
import type { IAutoMovieMotionHumanFootStrike } from "../striking/IAutoMovieMotionHumanFootStrike";
import type { IAutoMovieMotionHumanKick } from "../striking/IAutoMovieMotionHumanKick";
import type { IAutoMovieMotionHumanKnee } from "../striking/IAutoMovieMotionHumanKnee";
import type { IAutoMovieMotionHumanPunch } from "../striking/IAutoMovieMotionHumanPunch";
import type { IAutoMovieMotionHumanStep } from "../striking/IAutoMovieMotionHumanStep";

/**
 * The strikes: punches, kicks, knees and the close and foot strikes, which share one timing model, the striking reach solve and the performer's skill (`StrikingSkill`). A lone punch takes 0.405 s from launch to contact at elite skill and 0.43 s at novice; a kick takes 0.33 s at elite and 0.39 s at novice.
 *
 * @template Chain The chain every method returns; the chain implements this interface.
 * @evidence contracts/development/common.md#meaningful-documentation States the family's shared model and what its methods have in common.
 * @evidence contracts/development/design.md#principled-representation One method per law of the Strike family, each taking the law's own parameter type.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The Strike laws and nothing the other families own.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each method takes the existing parameter type of its law; nothing is redefined.
 */
export interface IAutoMovieMotionHumanStrike<Chain> {
  /**
   * A punch: the fist's knuckles brought onto the target along a measured path and returned to the guard, with the trunk turning and the feet stepping or pivoting to carry the shoulder.
   *
   * @param params The `technique`, `hand`, `at`, `accuracy`, `feint` and `manner` of `IAutoMovieMotionHumanPunch.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanStrike.punch is provided by the chain that implements IAutoMovieMotionHumanStrike.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanStrike.punch is provided by the chain that implements IAutoMovieMotionHumanStrike.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanStrike.punch is provided by the chain that implements IAutoMovieMotionHumanStrike.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanStrike.punch is provided by the chain that implements IAutoMovieMotionHumanStrike.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanStrike.punch is provided by the chain that implements IAutoMovieMotionHumanStrike.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanStrike.punch is provided by the chain that implements IAutoMovieMotionHumanStrike.
   */
  punch(params: IAutoMovieMotionHumanStrike.IPunch, anchor?: string): Chain;

  /**
   * A kick: the round kick's lower shin or the push kick's ball of the foot brought onto the target, through a chamber, and recoiled to the replant.
   *
   * @param params The `technique`, `leg`, `at`, `accuracy` and `feint` of `IAutoMovieMotionHumanKick.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanStrike.kick is provided by the chain that implements IAutoMovieMotionHumanStrike.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanStrike.kick is provided by the chain that implements IAutoMovieMotionHumanStrike.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanStrike.kick is provided by the chain that implements IAutoMovieMotionHumanStrike.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanStrike.kick is provided by the chain that implements IAutoMovieMotionHumanStrike.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanStrike.kick is provided by the chain that implements IAutoMovieMotionHumanStrike.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanStrike.kick is provided by the chain that implements IAutoMovieMotionHumanStrike.
   */
  kick(params: IAutoMovieMotionHumanStrike.IKick, anchor?: string): Chain;

  /**
   * A knee strike: the knee driven up and forward onto the target while the hands hold the opponent's head or neck (the clinch) or stay at the guard.
   *
   * @param params The `at` and `leg` of `IAutoMovieMotionHumanKnee.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanStrike.knee is provided by the chain that implements IAutoMovieMotionHumanStrike.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanStrike.knee is provided by the chain that implements IAutoMovieMotionHumanStrike.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanStrike.knee is provided by the chain that implements IAutoMovieMotionHumanStrike.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanStrike.knee is provided by the chain that implements IAutoMovieMotionHumanStrike.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanStrike.knee is provided by the chain that implements IAutoMovieMotionHumanStrike.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanStrike.knee is provided by the chain that implements IAutoMovieMotionHumanStrike.
   */
  knee(params: IAutoMovieMotionHumanStrike.IKnee, anchor?: string): Chain;

  /**
   * A close strike: the point of the elbow, the back of a spinning fist or the forehead brought onto a target inside the punch's range.
   *
   * @param params The `technique`, `at`, `arm` and `feint` of `IAutoMovieMotionHumanCloseStrike.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanStrike.closeStrike is provided by the chain that implements IAutoMovieMotionHumanStrike.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanStrike.closeStrike is provided by the chain that implements IAutoMovieMotionHumanStrike.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanStrike.closeStrike is provided by the chain that implements IAutoMovieMotionHumanStrike.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanStrike.closeStrike is provided by the chain that implements IAutoMovieMotionHumanStrike.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanStrike.closeStrike is provided by the chain that implements IAutoMovieMotionHumanStrike.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanStrike.closeStrike is provided by the chain that implements IAutoMovieMotionHumanStrike.
   */
  closeStrike(
    params: IAutoMovieMotionHumanStrike.ICloseStrike,
    anchor?: string,
  ): Chain;

  /**
   * A foot strike beyond the round and push kicks: the heel, the sole or the blade of the foot brought onto the target through a chamber and recoiled to the stance.
   *
   * @param params The `technique`, `at`, `leg`, `spin` and `jump` of `IAutoMovieMotionHumanFootStrike.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanStrike.footStrike is provided by the chain that implements IAutoMovieMotionHumanStrike.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanStrike.footStrike is provided by the chain that implements IAutoMovieMotionHumanStrike.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanStrike.footStrike is provided by the chain that implements IAutoMovieMotionHumanStrike.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanStrike.footStrike is provided by the chain that implements IAutoMovieMotionHumanStrike.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanStrike.footStrike is provided by the chain that implements IAutoMovieMotionHumanStrike.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanStrike.footStrike is provided by the chain that implements IAutoMovieMotionHumanStrike.
   */
  footStrike(
    params: IAutoMovieMotionHumanStrike.IFootStrike,
    anchor?: string,
  ): Chain;

  /**
   * Fighting-stance footwork: steps that keep the stance, the foot on the side of travel moving first and the other following to restore it without crossing (IBA coaching manual).
   *
   * @param params The `direction`, `steps`, `length`, `turn`, `lead` and `guard` of `IAutoMovieMotionHumanStep.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanStrike.step is provided by the chain that implements IAutoMovieMotionHumanStrike.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanStrike.step is provided by the chain that implements IAutoMovieMotionHumanStrike.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanStrike.step is provided by the chain that implements IAutoMovieMotionHumanStrike.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanStrike.step is provided by the chain that implements IAutoMovieMotionHumanStrike.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanStrike.step is provided by the chain that implements IAutoMovieMotionHumanStrike.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanStrike.step is provided by the chain that implements IAutoMovieMotionHumanStrike.
   */
  step(params: IAutoMovieMotionHumanStrike.IStep, anchor?: string): Chain;

  /**
   * Martial-art forms other than kickboxing (#3252): the karate horse stance (kiba-dachi), alternating straight punches from it (choku-zuki) and the tai chi push in a bow stance.
   *
   * @param params The `kind`, `count`, `seconds`, `lead` and `manner` of `IAutoMovieMotionHumanMartialArt.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanStrike.martialArt is provided by the chain that implements IAutoMovieMotionHumanStrike.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanStrike.martialArt is provided by the chain that implements IAutoMovieMotionHumanStrike.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanStrike.martialArt is provided by the chain that implements IAutoMovieMotionHumanStrike.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanStrike.martialArt is provided by the chain that implements IAutoMovieMotionHumanStrike.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanStrike.martialArt is provided by the chain that implements IAutoMovieMotionHumanStrike.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanStrike.martialArt is provided by the chain that implements IAutoMovieMotionHumanStrike.
   */
  martialArt(
    params: IAutoMovieMotionHumanStrike.IMartialArt,
    anchor?: string,
  ): Chain;
}

/**
 * The parameter types of the Strike methods.
 */
export namespace IAutoMovieMotionHumanStrike {
  /**
   * The parameters of `punch`: `IAutoMovieMotionHumanPunch.IParams`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanPunch.IParams`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanPunch.IParams` owns the shape; the alias serves `punch` of this family, naming its parameters in the family namespace without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type IPunch = IAutoMovieMotionHumanPunch.IParams;

  /**
   * The parameters of `kick`: `IAutoMovieMotionHumanKick.IParams`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanKick.IParams`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanKick.IParams` owns the shape; the alias serves `kick` of this family, naming its parameters in the family namespace without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type IKick = IAutoMovieMotionHumanKick.IParams;

  /**
   * The parameters of `knee`: `IAutoMovieMotionHumanKnee.IParams`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanKnee.IParams`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanKnee.IParams` owns the shape; the alias serves `knee` of this family, naming its parameters in the family namespace without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type IKnee = IAutoMovieMotionHumanKnee.IParams;

  /**
   * The parameters of `closeStrike`: `IAutoMovieMotionHumanCloseStrike.IParams`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanCloseStrike.IParams`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanCloseStrike.IParams` owns the shape; the alias serves `closeStrike` of this family, naming its parameters in the family namespace without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type ICloseStrike = IAutoMovieMotionHumanCloseStrike.IParams;

  /**
   * The parameters of `footStrike`: `IAutoMovieMotionHumanFootStrike.IParams`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanFootStrike.IParams`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanFootStrike.IParams` owns the shape; the alias serves `footStrike` of this family, naming its parameters in the family namespace without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type IFootStrike = IAutoMovieMotionHumanFootStrike.IParams;

  /**
   * The parameters of `step`: `IAutoMovieMotionHumanStep.IParams`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanStep.IParams`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanStep.IParams` owns the shape; the alias serves `step` of this family, naming its parameters in the family namespace without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type IStep = IAutoMovieMotionHumanStep.IParams;

  /**
   * The parameters of `martialArt`: `IAutoMovieMotionHumanMartialArt.IParams`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanMartialArt.IParams`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanMartialArt.IParams` owns the shape; the alias serves `martialArt` of this family, naming its parameters in the family namespace without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type IMartialArt = IAutoMovieMotionHumanMartialArt.IParams;
}
