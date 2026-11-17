import type { IAutoMovieMotionHumanOperate } from "../affordance/IAutoMovieMotionHumanOperate";
import type { IAutoMovieMotionHumanHandToFace } from "../daily/IAutoMovieMotionHumanHandToFace";
import type { IAutoMovieMotionHumanDress } from "../dressing/IAutoMovieMotionHumanDress";
import type { IAutoMovieMotionHumanGesture } from "../everyday/IAutoMovieMotionHumanGesture";
import type { IAutoMovieMotionHumanLook } from "../everyday/IAutoMovieMotionHumanLook";
import type { IAutoMovieMotionHumanRest } from "../everyday/IAutoMovieMotionHumanRest";
import type { IAutoMovieMotionHumanTypeText } from "../everyday/IAutoMovieMotionHumanTypeText";
import type { IAutoMovieMotionHumanUseTool } from "../tasks/IAutoMovieMotionHumanUseTool";
import type { IAutoMovieMotionHumanWipe } from "../tasks/IAutoMovieMotionHumanWipe";
import type { IAutoMovieMotionHumanSelfAction } from "../touch/IAutoMovieMotionHumanSelfAction";
import type { IAutoMovieMotionHumanTouch } from "../touch/IAutoMovieMotionHumanTouch";
import type { IAutoMovieMotionHumanChainPosture } from "./IAutoMovieMotionHumanChainPosture";

/**
 * The chain methods of the hands, the head and the eyes on the body's own
 * support: looking, gesturing, resting the hands, touching, the daily tasks
 * at the face, dressing, and working a tool, a surface, a mechanism or a
 * keyboard.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the family and documents each method.
 * @evidence contracts/development/design.md#principled-representation One method per action of the family, each `act` under the action's name.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The upper-body actions only.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every method takes its law's own parameter type.
 */
export interface IAutoMovieMotionHumanChainManual extends IAutoMovieMotionHumanChainPosture {
  /**
   * Stand and look at a target, turning the eyes, head and trunk.
   *
   * @param params Target, recruitment, cue and time.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanChainManual.look: Stand and look at a target, turning the eyes, head and trunk.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanChainManual.look is used through packages/motions/src/chain/HumanChainManual.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanChainManual.look is used through packages/motions/src/chain/HumanChainManual.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanChainManual.look is used through packages/motions/src/chain/HumanChainManual.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanChainManual.look is used through packages/motions/src/chain/HumanChainManual.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanChainManual.look is used through packages/motions/src/chain/HumanChainManual.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanChainManual.look is used through packages/motions/src/chain/HumanChainManual.ts.
   */
  look(params: IAutoMovieMotionHumanLook.IParams, anchor?: string): this;

  /**
   * Make a communicative gesture of the hands, head or trunk.
   *
   * @param params The gesture and its options.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanChainManual.gesture: Make a communicative gesture of the hands, head or trunk.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanChainManual.gesture is used through packages/motions/src/chain/HumanChainManual.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanChainManual.gesture is used through packages/motions/src/chain/HumanChainManual.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanChainManual.gesture is used through packages/motions/src/chain/HumanChainManual.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanChainManual.gesture is used through packages/motions/src/chain/HumanChainManual.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanChainManual.gesture is used through packages/motions/src/chain/HumanChainManual.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanChainManual.gesture is used through packages/motions/src/chain/HumanChainManual.ts.
   */
  gesture(params: IAutoMovieMotionHumanGesture.IParams, anchor?: string): this;

  /**
   * Stand with the hands at rest places (pockets, hips, crossed arms).
   *
   * @param params Each hand's place and the time.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanChainManual.rest: Stand with the hands at rest places (pockets, hips, crossed arms).
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanChainManual.rest is used through packages/motions/src/chain/HumanChainManual.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanChainManual.rest is used through packages/motions/src/chain/HumanChainManual.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanChainManual.rest is used through packages/motions/src/chain/HumanChainManual.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanChainManual.rest is used through packages/motions/src/chain/HumanChainManual.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanChainManual.rest is used through packages/motions/src/chain/HumanChainManual.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanChainManual.rest is used through packages/motions/src/chain/HumanChainManual.ts.
   */
  rest(params?: IAutoMovieMotionHumanRest.IParams, anchor?: string): this;

  /**
   * Lay a hand on a partner's or one's own region and move it there by a
   * kind of touch: a tap, a pat, a stroke, a rub, a press, a squeeze, a hold
   * or a scratch.
   *
   * @param params The region, the kind, the part of the hand, the hand and the timing.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanChainManual.touch: Lay a hand on a partner's or one's own region and move it there by a kind of touch: a tap, a pat, a stroke, a rub, a press, a squeeze, a hold or a scratch.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanChainManual.touch is used through packages/motions/src/chain/HumanChainManual.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanChainManual.touch is used through packages/motions/src/chain/HumanChainManual.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanChainManual.touch is used through packages/motions/src/chain/HumanChainManual.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanChainManual.touch is used through packages/motions/src/chain/HumanChainManual.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanChainManual.touch is used through packages/motions/src/chain/HumanChainManual.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanChainManual.touch is used through packages/motions/src/chain/HumanChainManual.ts.
   */
  touch(params: IAutoMovieMotionHumanTouch.IParams, anchor?: string): this;

  /**
   * Perform a whole-body self action: a stretch, victory arms, a fist pump,
   * a neck or shoulder roll.
   *
   * @param params The kind, the hand and the count.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanChainManual.selfAction: Perform a whole-body self action: a stretch, victory arms, a fist pump, a neck or shoulder roll.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanChainManual.selfAction is used through packages/motions/src/chain/HumanChainManual.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanChainManual.selfAction is used through packages/motions/src/chain/HumanChainManual.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanChainManual.selfAction is used through packages/motions/src/chain/HumanChainManual.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanChainManual.selfAction is used through packages/motions/src/chain/HumanChainManual.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanChainManual.selfAction is used through packages/motions/src/chain/HumanChainManual.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanChainManual.selfAction is used through packages/motions/src/chain/HumanChainManual.ts.
   */
  selfAction(
    params: IAutoMovieMotionHumanSelfAction.IParams,
    anchor?: string,
  ): this;

  /**
   * Perform a hand-to-face task of daily living: drink, eat, phone, read or
   * groom.
   *
   * @param params The task, the hand, the count and the time.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanChainManual.handToFace: Perform a hand-to-face task of daily living: drink, eat, phone, read or groom.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanChainManual.handToFace is used through packages/motions/src/chain/HumanChainManual.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanChainManual.handToFace is used through packages/motions/src/chain/HumanChainManual.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanChainManual.handToFace is used through packages/motions/src/chain/HumanChainManual.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanChainManual.handToFace is used through packages/motions/src/chain/HumanChainManual.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanChainManual.handToFace is used through packages/motions/src/chain/HumanChainManual.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanChainManual.handToFace is used through packages/motions/src/chain/HumanChainManual.ts.
   */
  handToFace(
    params: IAutoMovieMotionHumanHandToFace.IParams,
    anchor?: string,
  ): this;

  /**
   * Put on a hat or a pair of glasses with both hands.
   *
   * @param params The item.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanChainManual.dress: Put on a hat or a pair of glasses with both hands.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanChainManual.dress is used through packages/motions/src/chain/HumanChainManual.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanChainManual.dress is used through packages/motions/src/chain/HumanChainManual.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanChainManual.dress is used through packages/motions/src/chain/HumanChainManual.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanChainManual.dress is used through packages/motions/src/chain/HumanChainManual.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanChainManual.dress is used through packages/motions/src/chain/HumanChainManual.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanChainManual.dress is used through packages/motions/src/chain/HumanChainManual.ts.
   */
  dress(params: IAutoMovieMotionHumanDress.IParams, anchor?: string): this;

  /**
   * Work a one-handed tool in cycles over a work point: a hammer, a saw, a
   * spoon or a screwdriver.
   *
   * @param params The tool, the work point, the hand and the cycles.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanChainManual.useTool: Work a one-handed tool in cycles over a work point: a hammer, a saw, a spoon or a screwdriver.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanChainManual.useTool is used through packages/motions/src/chain/HumanChainManual.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanChainManual.useTool is used through packages/motions/src/chain/HumanChainManual.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanChainManual.useTool is used through packages/motions/src/chain/HumanChainManual.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanChainManual.useTool is used through packages/motions/src/chain/HumanChainManual.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanChainManual.useTool is used through packages/motions/src/chain/HumanChainManual.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanChainManual.useTool is used through packages/motions/src/chain/HumanChainManual.ts.
   */
  useTool(params: IAutoMovieMotionHumanUseTool.IParams, anchor?: string): this;

  /**
   * Wipe a level surface with the flat palm in circles.
   *
   * @param params The surface point, the hand and the cycles.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanChainManual.wipe: Wipe a level surface with the flat palm in circles.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanChainManual.wipe is used through packages/motions/src/chain/HumanChainManual.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanChainManual.wipe is used through packages/motions/src/chain/HumanChainManual.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanChainManual.wipe is used through packages/motions/src/chain/HumanChainManual.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanChainManual.wipe is used through packages/motions/src/chain/HumanChainManual.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanChainManual.wipe is used through packages/motions/src/chain/HumanChainManual.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanChainManual.wipe is used through packages/motions/src/chain/HumanChainManual.ts.
   */
  wipe(params: IAutoMovieMotionHumanWipe.IParams, anchor?: string): this;

  /**
   * Press a button, turn a knob, slide a drawer or swing a door by its
   * handle.
   *
   * @param params The mechanism and the hand.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanChainManual.operate: Press a button, turn a knob, slide a drawer or swing a door by its handle.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanChainManual.operate is used through packages/motions/src/chain/HumanChainManual.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanChainManual.operate is used through packages/motions/src/chain/HumanChainManual.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanChainManual.operate is used through packages/motions/src/chain/HumanChainManual.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanChainManual.operate is used through packages/motions/src/chain/HumanChainManual.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanChainManual.operate is used through packages/motions/src/chain/HumanChainManual.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanChainManual.operate is used through packages/motions/src/chain/HumanChainManual.ts.
   */
  operate(params: IAutoMovieMotionHumanOperate.IParams, anchor?: string): this;

  /**
   * Type a text on a keyboard with the index fingertips, holding the current
   * posture.
   *
   * @param params The keyboard's prop subject and the text.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanChainManual.typeText: Type a text on a keyboard with the index fingertips, holding the current posture.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanChainManual.typeText is used through packages/motions/src/chain/HumanChainManual.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanChainManual.typeText is used through packages/motions/src/chain/HumanChainManual.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanChainManual.typeText is used through packages/motions/src/chain/HumanChainManual.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanChainManual.typeText is used through packages/motions/src/chain/HumanChainManual.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanChainManual.typeText is used through packages/motions/src/chain/HumanChainManual.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanChainManual.typeText is used through packages/motions/src/chain/HumanChainManual.ts.
   */
  typeText(
    params: IAutoMovieMotionHumanTypeText.IParams,
    anchor?: string,
  ): this;
}
