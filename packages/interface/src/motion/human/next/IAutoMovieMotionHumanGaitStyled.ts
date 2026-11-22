import type { IAutoMovieMotionHumanGait as ILegacyGait } from "../lexicon/IAutoMovieMotionHumanGait";

/**
 * Mechanism: the styled gaits, which run the walk's stepping plan in a gait of their own: the march and double time at a drill cadence, the sneak, prowl and tiptoe, the moods, the limp and the drunk walk. The speed model is on `IAutoMovieMotionHumanGait`.
 *
 * @template Chain The chain every method returns; the chain implements this interface.
 * @evidence contracts/development/common.md#meaningful-documentation States the family, the speed model it shares, the scale of every gait value and that rows are presets.
 * @evidence contracts/development/design.md#principled-representation One method per gait law, each taking the law's own parameter type, over the one speed model of the walk's stepping plan.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The gait laws of the walk family: walk, run, approach, carryLoad, the pursuit laws, the door, the aided walks and the styled gaits.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each method takes the existing parameter type of its law; no gait has a method of its own that only respells a pace.
 */
export interface IAutoMovieMotionHumanGaitStyled<Chain> {
  /**
   * March at a drill regulation's cadence and step.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanGaitStyled.march: March at a drill regulation's cadence and step.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanGaitStyled.march is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanGaitStyled.march is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanGaitStyled.march is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanGaitStyled.march is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanGaitStyled.march is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanGaitStyled.march is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   */
  march(params: IAutoMovieMotionHumanGaitStyled.IMarch, anchor?: string): Chain;

  /**
   * Run the drill step at the double-time cadence.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanGaitStyled.doubleTime: Run the drill step at the double-time cadence.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanGaitStyled.doubleTime is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanGaitStyled.doubleTime is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanGaitStyled.doubleTime is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanGaitStyled.doubleTime is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanGaitStyled.doubleTime is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanGaitStyled.doubleTime is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   */
  doubleTime(params: IAutoMovieMotionHumanGaitStyled.IDoubleTime, anchor?: string): Chain;

  /**
   * Walk slower than the slow walk on short steps with the pelvis lowered.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanGaitStyled.sneak: Walk slower than the slow walk on short steps with the pelvis lowered.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanGaitStyled.sneak is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanGaitStyled.sneak is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanGaitStyled.sneak is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanGaitStyled.sneak is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanGaitStyled.sneak is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanGaitStyled.sneak is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   */
  sneak(params: IAutoMovieMotionHumanGaitStyled.ISneak, anchor?: string): Chain;

  /**
   * Sneak on deeply bent knees.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanGaitStyled.prowl: Sneak on deeply bent knees.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanGaitStyled.prowl is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanGaitStyled.prowl is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanGaitStyled.prowl is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanGaitStyled.prowl is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanGaitStyled.prowl is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanGaitStyled.prowl is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   */
  prowl(params: IAutoMovieMotionHumanGaitStyled.IProwl, anchor?: string): Chain;

  /**
   * Sneak on the balls of the feet with the heels never set down.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanGaitStyled.tiptoe: Sneak on the balls of the feet with the heels never set down.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanGaitStyled.tiptoe is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanGaitStyled.tiptoe is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanGaitStyled.tiptoe is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanGaitStyled.tiptoe is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanGaitStyled.tiptoe is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanGaitStyled.tiptoe is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   */
  tiptoe(params: IAutoMovieMotionHumanGaitStyled.ITiptoe, anchor?: string): Chain;

  /**
   * Walk slowly with the arms barely swinging and the trunk slumped.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanGaitStyled.sad: Walk slowly with the arms barely swinging and the trunk slumped.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanGaitStyled.sad is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanGaitStyled.sad is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanGaitStyled.sad is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanGaitStyled.sad is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanGaitStyled.sad is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanGaitStyled.sad is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   */
  sad(params: IAutoMovieMotionHumanGaitStyled.ISad, anchor?: string): Chain;

  /**
   * Walk upright with the arms swung freely.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanGaitStyled.proud: Walk upright with the arms swung freely.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanGaitStyled.proud is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanGaitStyled.proud is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanGaitStyled.proud is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanGaitStyled.proud is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanGaitStyled.proud is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanGaitStyled.proud is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   */
  proud(params: IAutoMovieMotionHumanGaitStyled.IProud, anchor?: string): Chain;

  /**
   * Walk sparing one leg, standing on it briefly.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanGaitStyled.limp: Walk sparing one leg, standing on it briefly.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanGaitStyled.limp is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanGaitStyled.limp is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanGaitStyled.limp is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanGaitStyled.limp is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanGaitStyled.limp is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanGaitStyled.limp is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   */
  limp(params: IAutoMovieMotionHumanGaitStyled.ILimp, anchor?: string): Chain;

  /**
   * Limp with the spared leg also swinging straight.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanGaitStyled.stiffLimp: Limp with the spared leg also swinging straight.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanGaitStyled.stiffLimp is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanGaitStyled.stiffLimp is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanGaitStyled.stiffLimp is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanGaitStyled.stiffLimp is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanGaitStyled.stiffLimp is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanGaitStyled.stiffLimp is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   */
  stiffLimp(params: IAutoMovieMotionHumanGaitStyled.IStiffLimp, anchor?: string): Chain;
}

/**
 * The parameter types of the GaitStyled methods.
 */
export namespace IAutoMovieMotionHumanGaitStyled {
  /**
   * The parameters of `march`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the parameter type of `march`: the existing type of its law.
   */
  export type IMarch = ILegacyGait.IMarch;

  /**
   * The parameters of `doubleTime`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the parameter type of `doubleTime`: the existing type of its law.
   */
  export type IDoubleTime = ILegacyGait.IParams;

  /**
   * The parameters of `sneak`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the parameter type of `sneak`: the existing type of its law.
   */
  export type ISneak = ILegacyGait.IParams;

  /**
   * The parameters of `prowl`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the parameter type of `prowl`: the existing type of its law.
   */
  export type IProwl = ILegacyGait.IParams;

  /**
   * The parameters of `tiptoe`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the parameter type of `tiptoe`: the existing type of its law.
   */
  export type ITiptoe = ILegacyGait.IParams;

  /**
   * The parameters of `sad`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the parameter type of `sad`: the existing type of its law.
   */
  export type ISad = ILegacyGait.IParams;

  /**
   * The parameters of `proud`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the parameter type of `proud`: the existing type of its law.
   */
  export type IProud = ILegacyGait.IParams;

  /**
   * The parameters of `limp`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the parameter type of `limp`: the existing type of its law.
   */
  export type ILimp = ILegacyGait.ILimp;

  /**
   * The parameters of `stiffLimp`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the parameter type of `stiffLimp`: the existing type of its law.
   */
  export type IStiffLimp = ILegacyGait.ILimp;
}
