import type { IAutoMovieMotionHumanAidWalk } from "../lexicon/IAutoMovieMotionHumanAidWalk";
import type { IAutoMovieMotionHumanCaneSweep } from "../lexicon/IAutoMovieMotionHumanCaneSweep";
import type { IAutoMovieMotionHumanCrutchWalk } from "../lexicon/IAutoMovieMotionHumanCrutchWalk";
import type { IAutoMovieMotionHumanFrailWalk } from "../lexicon/IAutoMovieMotionHumanFrailWalk";

/**
 * The aided walks of the Gait family: a cane, a crutch or a walking frame over authored floor stations, two crutches, the frail walk, and a long cane swept over a walk. The speed model and what a method's return and anchor are, are on `IAutoMovieMotionHumanGait`.
 *
 * @template Chain The chain every method returns; the chain implements this interface.
 * @evidence contracts/development/common.md#meaningful-documentation States the walks it holds and where the shared speed model, return and anchor are documented.
 * @evidence contracts/development/design.md#principled-representation One method per gait law, each taking the law's own parameter type, over the one speed model of the walk's stepping plan.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The gait laws of the walk family: walk, run, approach, carryLoad, the pursuit laws, the door, the aided walks and the styled gaits.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each method takes the existing parameter type of its law; no gait has a method of its own that only respells a pace.
 */
export interface IAutoMovieMotionHumanGaitAided<Chain> {
  /**
   * Walk through the authored floor stations with a cane or a crutch in one
   * hand, advanced during the opposite foot's swing, or behind a walking frame
   * advanced while both feet stand, and stop at the last station holding the
   * aid. Each station's seconds set its speed: no natural aided speed is
   * defined, and 0.6 m/s or slower fits a frail walker (Studenski et al. 2011).
   *
   * @param params The aid's kind and prop, the hand for a cane or crutch, and the floor stations.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the aided walk appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the support order of each aid, where the walk ends, what sets the speed with its source, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanGaitAided.aidWalk is provided by the chain that implements IAutoMovieMotionHumanGaitAided.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanGaitAided.aidWalk is provided by the chain that implements IAutoMovieMotionHumanGaitAided.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanGaitAided.aidWalk is provided by the chain that implements IAutoMovieMotionHumanGaitAided.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanGaitAided.aidWalk is provided by the chain that implements IAutoMovieMotionHumanGaitAided.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanGaitAided.aidWalk is provided by the chain that implements IAutoMovieMotionHumanGaitAided.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanGaitAided.aidWalk is provided by the chain that implements IAutoMovieMotionHumanGaitAided.
   */
  aidWalk(
    params: IAutoMovieMotionHumanGaitAided.IAidWalk,
    anchor?: string,
  ): Chain;

  /**
   * Walk to `to` as a frail older person does, graded by `severity` from the
   * ordinary walk (0) to a shuffle (1): slower, on shorter and lower steps and
   * a wider base, the trunk flexed forward and the arms barely swinging
   * (`HumanFrailWalk`). It stops at `to` as a walk does.
   *
   * @param params The destination, waypoints, arrival heading, severity and manner.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the frail walk appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the severity grades and between which ends, where the walk ends, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanGaitAided.frailWalk is provided by the chain that implements IAutoMovieMotionHumanGaitAided.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanGaitAided.frailWalk is provided by the chain that implements IAutoMovieMotionHumanGaitAided.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanGaitAided.frailWalk is provided by the chain that implements IAutoMovieMotionHumanGaitAided.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanGaitAided.frailWalk is provided by the chain that implements IAutoMovieMotionHumanGaitAided.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanGaitAided.frailWalk is provided by the chain that implements IAutoMovieMotionHumanGaitAided.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanGaitAided.frailWalk is provided by the chain that implements IAutoMovieMotionHumanGaitAided.
   */
  frailWalk(
    params: IAutoMovieMotionHumanGaitAided.IFrailWalk,
    anchor?: string,
  ): Chain;

  /**
   * Walk through the floor stations on two crutches: at each station both tips
   * plant ahead first, then the body swings on the hands in the three-point,
   * swing-to or swing-through gait (Physiopedia, Crutches), the three-point
   * gait holding the injured foot off the floor. It stops at the last station
   * standing between the crutches.
   *
   * @param params The two crutch props, the floor stations, the crutch gait and the injured leg.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the crutch walk appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each station's order, the three gaits with their source, where the walk ends, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanGaitAided.crutchWalk is provided by the chain that implements IAutoMovieMotionHumanGaitAided.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanGaitAided.crutchWalk is provided by the chain that implements IAutoMovieMotionHumanGaitAided.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanGaitAided.crutchWalk is provided by the chain that implements IAutoMovieMotionHumanGaitAided.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanGaitAided.crutchWalk is provided by the chain that implements IAutoMovieMotionHumanGaitAided.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanGaitAided.crutchWalk is provided by the chain that implements IAutoMovieMotionHumanGaitAided.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanGaitAided.crutchWalk is provided by the chain that implements IAutoMovieMotionHumanGaitAided.
   */
  crutchWalk(
    params: IAutoMovieMotionHumanGaitAided.ICrutchWalk,
    anchor?: string,
  ): Chain;

  /**
   * Sweep a long cane for `seconds` over the walk this action rides (`over`):
   * the cane hand at the body's midline, the tip arcing from side to side just
   * wider than the body and touching the floor opposite each landing foot
   * (two-point touch) or sliding along it (constant contact). A sweep over
   * anything but a walk of at least one step is refused.
   *
   * @param params The cane prop, the cane hand, the technique and the sweep's seconds.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the sweep appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States that the sweep rides a walk, the hand and tip paths of each technique, its refusal, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanGaitAided.caneSweep is provided by the chain that implements IAutoMovieMotionHumanGaitAided.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanGaitAided.caneSweep is provided by the chain that implements IAutoMovieMotionHumanGaitAided.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanGaitAided.caneSweep is provided by the chain that implements IAutoMovieMotionHumanGaitAided.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanGaitAided.caneSweep is provided by the chain that implements IAutoMovieMotionHumanGaitAided.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanGaitAided.caneSweep is provided by the chain that implements IAutoMovieMotionHumanGaitAided.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanGaitAided.caneSweep is provided by the chain that implements IAutoMovieMotionHumanGaitAided.
   */
  caneSweep(
    params: IAutoMovieMotionHumanGaitAided.ICaneSweep,
    anchor?: string,
  ): Chain;
}

/**
 * The parameter types of the GaitAided methods.
 */
export namespace IAutoMovieMotionHumanGaitAided {
  /**
   * The parameters of `aidWalk`: the law's own `IAutoMovieMotionHumanAidWalk`, a cane or crutch held or a walker, with the floor stations, unchanged.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method it parameterises, the law type it aliases unchanged and that type's two alternatives.
   * @evidence contracts/development/design.md#principled-representation An alias of the law's union discriminated by `kind`; the stations' metres, degrees and seconds are those the law type states, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanAidWalk` owns the type; the alias serves this family's `aidWalk` signature.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast, so `aidWalk` takes the type its law reads.
   */
  export type IAidWalk = IAutoMovieMotionHumanAidWalk;

  /**
   * The parameters of `frailWalk`: the law's own `IAutoMovieMotionHumanFrailWalk`, unchanged.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method it parameterises and the law type it aliases unchanged.
   * @evidence contracts/development/design.md#principled-representation An alias: units, frames, defaults and invariants are those the law type states; the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanFrailWalk` owns the type; the alias serves this family's `frailWalk` signature.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast, so `frailWalk` takes the type its law reads.
   */
  export type IFrailWalk = IAutoMovieMotionHumanFrailWalk;

  /**
   * The parameters of `crutchWalk`: the law's own `IAutoMovieMotionHumanCrutchWalk`, unchanged.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method it parameterises and the law type it aliases unchanged.
   * @evidence contracts/development/design.md#principled-representation An alias: units, frames, defaults and invariants are those the law type states; the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanCrutchWalk` owns the type; the alias serves this family's `crutchWalk` signature.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast, so `crutchWalk` takes the type its law reads.
   */
  export type ICrutchWalk = IAutoMovieMotionHumanCrutchWalk;

  /**
   * The parameters of `caneSweep`: the law's own `IAutoMovieMotionHumanCaneSweep`, unchanged.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method it parameterises and the law type it aliases unchanged.
   * @evidence contracts/development/design.md#principled-representation An alias: units, frames, defaults and invariants are those the law type states; the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanCaneSweep` owns the type; the alias serves this family's `caneSweep` signature.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast, so `caneSweep` takes the type its law reads.
   */
  export type ICaneSweep = IAutoMovieMotionHumanCaneSweep;
}
