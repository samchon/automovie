import type { IAutoMovieMotionHumanDefend } from "../striking/IAutoMovieMotionHumanDefend";
import type { IAutoMovieMotionHumanGuard } from "../striking/IAutoMovieMotionHumanGuard";
import type { IAutoMovieMotionHumanKick } from "../striking/IAutoMovieMotionHumanKick";
import type { IAutoMovieMotionHumanKickboxingRing } from "../sport/kickboxing/IAutoMovieMotionHumanKickboxingRing";
import type { IAutoMovieMotionHumanKnee } from "../striking/IAutoMovieMotionHumanKnee";
import type { IAutoMovieMotionHumanPunch } from "../striking/IAutoMovieMotionHumanPunch";
import type { IAutoMovieMotionHumanStep } from "../striking/IAutoMovieMotionHumanStep";

/**
 * Mechanism: Behaviour: a kickboxing bout. The fighters stand in the stance of `IAutoMovieMotionHumanStrikingStance` (stance length 1.2 shoulder widths, knees flexed 32 degrees) inside a ring (`IAutoMovieMotionHumanKickboxingRing`), strike with the Strike family (a lone punch 0.405 s from launch to contact at elite skill, 0.35 s between alternating hands and 0.45 s for the same hand, a kick 0.33 s at elite skill) and keep the GLORY rules. No fighting distance in metres, no combination rhythm by skill and no champion speed is defined yet (provisional; they are added from sources in the fix round).
 *
 * @template Chain The chain every method returns; the chain implements this interface.
 * @evidence contracts/development/common.md#meaningful-documentation States the family's shared model and what its methods have in common.
 * @evidence contracts/development/design.md#principled-representation One method per law of the Kickboxing family, each taking the law's own parameter type.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The Kickboxing laws and nothing the other families own.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each method takes the existing parameter type of its law; nothing is redefined.
 */
export interface IAutoMovieMotionHumanKickboxing<Chain> {
  /**
   * A punch: the fist's knuckles brought onto the target along a measured path and returned to the guard, with the trunk turning and the feet stepping or pivoting to carry the shoulder.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanKickboxing.punch: A punch: the fist's knuckles brought onto the target along a measured path and returned to the guard, with the trunk turning and the feet stepping or pivoting to carry the shoulder.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanKickboxing.punch is provided by the chain that implements IAutoMovieMotionHumanKickboxing.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanKickboxing.punch is provided by the chain that implements IAutoMovieMotionHumanKickboxing.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanKickboxing.punch is provided by the chain that implements IAutoMovieMotionHumanKickboxing.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanKickboxing.punch is provided by the chain that implements IAutoMovieMotionHumanKickboxing.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanKickboxing.punch is provided by the chain that implements IAutoMovieMotionHumanKickboxing.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanKickboxing.punch is provided by the chain that implements IAutoMovieMotionHumanKickboxing.
   */
  punch(params: IAutoMovieMotionHumanKickboxing.IPunch, anchor?: string): Chain;

  /**
   * A kick: the round kick's lower shin or the push kick's ball of the foot brought onto the target, through a chamber, and recoiled to the replant.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanKickboxing.kick: A kick: the round kick's lower shin or the push kick's ball of the foot brought onto the target, through a chamber, and recoiled to the replant.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanKickboxing.kick is provided by the chain that implements IAutoMovieMotionHumanKickboxing.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanKickboxing.kick is provided by the chain that implements IAutoMovieMotionHumanKickboxing.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanKickboxing.kick is provided by the chain that implements IAutoMovieMotionHumanKickboxing.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanKickboxing.kick is provided by the chain that implements IAutoMovieMotionHumanKickboxing.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanKickboxing.kick is provided by the chain that implements IAutoMovieMotionHumanKickboxing.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanKickboxing.kick is provided by the chain that implements IAutoMovieMotionHumanKickboxing.
   */
  kick(params: IAutoMovieMotionHumanKickboxing.IKick, anchor?: string): Chain;

  /**
   * A knee strike: the knee driven up and forward onto the target while the hands hold the opponent's head or neck (the clinch) or stay at the guard.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanKickboxing.knee: A knee strike: the knee driven up and forward onto the target while the hands hold the opponent's head or neck (the clinch) or stay at the guard.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanKickboxing.knee is provided by the chain that implements IAutoMovieMotionHumanKickboxing.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanKickboxing.knee is provided by the chain that implements IAutoMovieMotionHumanKickboxing.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanKickboxing.knee is provided by the chain that implements IAutoMovieMotionHumanKickboxing.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanKickboxing.knee is provided by the chain that implements IAutoMovieMotionHumanKickboxing.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanKickboxing.knee is provided by the chain that implements IAutoMovieMotionHumanKickboxing.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanKickboxing.knee is provided by the chain that implements IAutoMovieMotionHumanKickboxing.
   */
  knee(params: IAutoMovieMotionHumanKickboxing.IKnee, anchor?: string): Chain;

  /**
   * Fighting-stance footwork: steps that keep the stance, the foot on the side of travel moving first and the other following to restore the stance without crossing (IBA coaching manual pp.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanKickboxing.step: Fighting-stance footwork: steps that keep the stance, the foot on the side of travel moving first and the other following to restore the stance without crossing (IBA coaching manual pp.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanKickboxing.step is provided by the chain that implements IAutoMovieMotionHumanKickboxing.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanKickboxing.step is provided by the chain that implements IAutoMovieMotionHumanKickboxing.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanKickboxing.step is provided by the chain that implements IAutoMovieMotionHumanKickboxing.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanKickboxing.step is provided by the chain that implements IAutoMovieMotionHumanKickboxing.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanKickboxing.step is provided by the chain that implements IAutoMovieMotionHumanKickboxing.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanKickboxing.step is provided by the chain that implements IAutoMovieMotionHumanKickboxing.
   */
  step(params: IAutoMovieMotionHumanKickboxing.IStep, anchor?: string): Chain;

  /**
   * A defence against one placed strike: a glove, forearm or shin brought to where the incoming weapon will be, or the head moved off its line.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanKickboxing.defend: A defence against one placed strike: a glove, forearm or shin brought to where the incoming weapon will be, or the head moved off its line.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanKickboxing.defend is provided by the chain that implements IAutoMovieMotionHumanKickboxing.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanKickboxing.defend is provided by the chain that implements IAutoMovieMotionHumanKickboxing.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanKickboxing.defend is provided by the chain that implements IAutoMovieMotionHumanKickboxing.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanKickboxing.defend is provided by the chain that implements IAutoMovieMotionHumanKickboxing.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanKickboxing.defend is provided by the chain that implements IAutoMovieMotionHumanKickboxing.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanKickboxing.defend is provided by the chain that implements IAutoMovieMotionHumanKickboxing.
   */
  defend(params: IAutoMovieMotionHumanKickboxing.IDefend, anchor?: string): Chain;

  /**
   * The fighting stance taken and held: from whatever the performer stands in, each foot steps to its stance place in turn (the rear foot first, so the lead foot stays a support), the root sinks until both knees soften and turns to the stance heading, and the gloves come up to the guard, then the stance holds with a light bounce through the knees.
   *
   * @param params The action's parameters.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanKickboxing.guard: The fighting stance taken and held: from whatever the performer stands in, each foot steps to its stance place in turn (the rear foot first, so the lead foot stays a support), the root sinks until both knees soften and turns to the stance heading, and the gloves come up to the guard, then the stance holds with a light bounce through the knees.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanKickboxing.guard is provided by the chain that implements IAutoMovieMotionHumanKickboxing.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanKickboxing.guard is provided by the chain that implements IAutoMovieMotionHumanKickboxing.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanKickboxing.guard is provided by the chain that implements IAutoMovieMotionHumanKickboxing.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanKickboxing.guard is provided by the chain that implements IAutoMovieMotionHumanKickboxing.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanKickboxing.guard is provided by the chain that implements IAutoMovieMotionHumanKickboxing.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanKickboxing.guard is provided by the chain that implements IAutoMovieMotionHumanKickboxing.
   */
  guard(params: IAutoMovieMotionHumanKickboxing.IGuard, anchor?: string): Chain;
}

/**
 * The parameter types of the Kickboxing methods.
 */
export namespace IAutoMovieMotionHumanKickboxing {
  /**
   * The parameters of `punch`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the parameter type of `punch`: the existing type of its law.
   */
  export type IPunch = IAutoMovieMotionHumanPunch.IParams;

  /**
   * The parameters of `kick`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the parameter type of `kick`: the existing type of its law.
   */
  export type IKick = IAutoMovieMotionHumanKick.IParams;

  /**
   * The parameters of `knee`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the parameter type of `knee`: the existing type of its law.
   */
  export type IKnee = IAutoMovieMotionHumanKnee.IParams;

  /**
   * The parameters of `step`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the parameter type of `step`: the existing type of its law.
   */
  export type IStep = IAutoMovieMotionHumanStep.IParams;

  /**
   * The parameters of `defend`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the parameter type of `defend`: the existing type of its law.
   */
  export type IDefend = IAutoMovieMotionHumanDefend.IParams;

  /**
   * The parameters of `guard`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the parameter type of `guard`: the existing type of its law.
   */
  export type IGuard = IAutoMovieMotionHumanGuard.IParams;

  /**
   * The IRing type of the behaviour.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The IRing type of the behaviour.
   */
  export type IRing = IAutoMovieMotionHumanKickboxingRing.IRing;

  /**
   * The ICorner type of the behaviour.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The ICorner type of the behaviour.
   */
  export type ICorner = IAutoMovieMotionHumanKickboxingRing.Corner;
}
