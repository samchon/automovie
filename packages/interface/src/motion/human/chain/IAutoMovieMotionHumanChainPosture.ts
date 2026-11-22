import type { IAutoMovieMotionHumanBend } from "../everyday/IAutoMovieMotionHumanBend";
import type { IAutoMovieMotionHumanCrouch } from "../everyday/IAutoMovieMotionHumanCrouch";
import type { IAutoMovieMotionHumanKneel } from "../everyday/IAutoMovieMotionHumanKneel";
import type { IAutoMovieMotionHumanRise } from "../everyday/IAutoMovieMotionHumanRise";
import type { IAutoMovieMotionHumanShift } from "../everyday/IAutoMovieMotionHumanShift";
import type { IAutoMovieMotionHumanSit } from "../everyday/IAutoMovieMotionHumanSit";
import type { IAutoMovieMotionHumanGetUp } from "../floor/IAutoMovieMotionHumanGetUp";
import type { IAutoMovieMotionHumanLieDown } from "../floor/IAutoMovieMotionHumanLieDown";
import type { IAutoMovieMotionHumanSupport } from "../next/IAutoMovieMotionHumanSupport";
import type { IAutoMovieMotionHumanChainTravel } from "./IAutoMovieMotionHumanChainTravel";

/**
 * The chain methods that change what the body rests on or how low it is:
 * onto a seat and off it, down to a low point, a crouch, a kneel and the
 * floor.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the family and documents each method.
 * @evidence contracts/development/design.md#principled-representation One method per action of the family, each `act` under the action's name.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The posture actions only.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every method takes its law's own parameter type.
 */
export interface IAutoMovieMotionHumanChainPosture extends IAutoMovieMotionHumanChainTravel {
  /**
   * Sit down on a seat behind the performer.
   *
   * @param params The seat, the seated back and the time seated.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanChainPosture.sit: Sit down on a seat behind the performer.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanChainPosture.sit is used through packages/motions/src/chain/HumanChainPosture.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanChainPosture.sit is used through packages/motions/src/chain/HumanChainPosture.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanChainPosture.sit is used through packages/motions/src/chain/HumanChainPosture.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanChainPosture.sit is used through packages/motions/src/chain/HumanChainPosture.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanChainPosture.sit is used through packages/motions/src/chain/HumanChainPosture.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanChainPosture.sit is used through packages/motions/src/chain/HumanChainPosture.ts.
   */
  sit(params: IAutoMovieMotionHumanSit.IParams, anchor?: string): this;

  /**
   * Stand up from the seat the performer sits on.
   *
   * @param params Nothing: rising takes no parameter.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanChainPosture.rise: Stand up from the seat the performer sits on.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanChainPosture.rise is used through packages/motions/src/chain/HumanChainPosture.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanChainPosture.rise is used through packages/motions/src/chain/HumanChainPosture.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanChainPosture.rise is used through packages/motions/src/chain/HumanChainPosture.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanChainPosture.rise is used through packages/motions/src/chain/HumanChainPosture.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanChainPosture.rise is used through packages/motions/src/chain/HumanChainPosture.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanChainPosture.rise is used through packages/motions/src/chain/HumanChainPosture.ts.
   */
  rise(params?: IAutoMovieMotionHumanRise.IParams, anchor?: string): this;

  /**
   * Edge sideways along the seat.
   *
   * @param params Distance and time seated after.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanChainPosture.shift: Edge sideways along the seat.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanChainPosture.shift is used through packages/motions/src/chain/HumanChainPosture.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanChainPosture.shift is used through packages/motions/src/chain/HumanChainPosture.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanChainPosture.shift is used through packages/motions/src/chain/HumanChainPosture.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanChainPosture.shift is used through packages/motions/src/chain/HumanChainPosture.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanChainPosture.shift is used through packages/motions/src/chain/HumanChainPosture.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanChainPosture.shift is used through packages/motions/src/chain/HumanChainPosture.ts.
   */
  shift(params: IAutoMovieMotionHumanShift.IParams, anchor?: string): this;

  /**
   * Bend down to bring a hand to a low point, feet planted.
   *
   * @param params Target, hand, strategy and hold.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanChainPosture.bend: Bend down to bring a hand to a low point, feet planted.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanChainPosture.bend is used through packages/motions/src/chain/HumanChainPosture.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanChainPosture.bend is used through packages/motions/src/chain/HumanChainPosture.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanChainPosture.bend is used through packages/motions/src/chain/HumanChainPosture.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanChainPosture.bend is used through packages/motions/src/chain/HumanChainPosture.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanChainPosture.bend is used through packages/motions/src/chain/HumanChainPosture.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanChainPosture.bend is used through packages/motions/src/chain/HumanChainPosture.ts.
   */
  bend(params: IAutoMovieMotionHumanBend.IParams, anchor?: string): this;

  /**
   * Crouch or squat over the planted feet, hold, then stand again.
   *
   * @param params Depth, heels and hold.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanChainPosture.crouch: Crouch or squat over the planted feet, hold, then stand again.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanChainPosture.crouch is used through packages/motions/src/chain/HumanChainPosture.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanChainPosture.crouch is used through packages/motions/src/chain/HumanChainPosture.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanChainPosture.crouch is used through packages/motions/src/chain/HumanChainPosture.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanChainPosture.crouch is used through packages/motions/src/chain/HumanChainPosture.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanChainPosture.crouch is used through packages/motions/src/chain/HumanChainPosture.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanChainPosture.crouch is used through packages/motions/src/chain/HumanChainPosture.ts.
   */
  crouch(params?: IAutoMovieMotionHumanCrouch.IParams, anchor?: string): this;

  /**
   * Kneel on one knee, on both, or sit back on the heels, then rise.
   *
   * @param params The kind of kneel, the knee, the hold and whether to rise.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanChainPosture.kneel: Kneel on one knee, on both, or sit back on the heels, then rise.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanChainPosture.kneel is used through packages/motions/src/chain/HumanChainPosture.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanChainPosture.kneel is used through packages/motions/src/chain/HumanChainPosture.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanChainPosture.kneel is used through packages/motions/src/chain/HumanChainPosture.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanChainPosture.kneel is used through packages/motions/src/chain/HumanChainPosture.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanChainPosture.kneel is used through packages/motions/src/chain/HumanChainPosture.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanChainPosture.kneel is used through packages/motions/src/chain/HumanChainPosture.ts.
   */
  kneel(params?: IAutoMovieMotionHumanKneel.IParams, anchor?: string): this;

  /**
   * Lie down on the floor from standing, supine, prone or on a side.
   *
   * @param params The lying position and the hold.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanChainPosture.lieDown: Lie down on the floor from standing, supine, prone or on a side.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanChainPosture.lieDown is used through packages/motions/src/chain/HumanChainPosture.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanChainPosture.lieDown is used through packages/motions/src/chain/HumanChainPosture.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanChainPosture.lieDown is used through packages/motions/src/chain/HumanChainPosture.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanChainPosture.lieDown is used through packages/motions/src/chain/HumanChainPosture.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanChainPosture.lieDown is used through packages/motions/src/chain/HumanChainPosture.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanChainPosture.lieDown is used through packages/motions/src/chain/HumanChainPosture.ts.
   */
  lieDown(params?: IAutoMovieMotionHumanLieDown.IParams, anchor?: string): this;

  /**
   * Get up from the floor to standing: from the back, the front, or the
   * hands and knees.
   *
   * @param params The pattern, the leading foot and the manner.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanChainPosture.getUp: Get up from the floor to standing: from the back, the front, or the hands and knees.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanChainPosture.getUp is used through packages/motions/src/chain/HumanChainPosture.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanChainPosture.getUp is used through packages/motions/src/chain/HumanChainPosture.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanChainPosture.getUp is used through packages/motions/src/chain/HumanChainPosture.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanChainPosture.getUp is used through packages/motions/src/chain/HumanChainPosture.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanChainPosture.getUp is used through packages/motions/src/chain/HumanChainPosture.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanChainPosture.getUp is used through packages/motions/src/chain/HumanChainPosture.ts.
   */
  getUp(params?: IAutoMovieMotionHumanGetUp.IParams, anchor?: string): this;

  /**
   * Move the body's weight across a sequence of supports, each stance's new
   * supports bearing before the old ones let go.
   *
   * @param params The stances and the surface a row's contacts touch.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanChainPosture.support: Move the body's weight across a sequence of supports, each stance's new supports bearing before the old ones let go.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanChainPosture.support is used through packages/motions/src/chain/HumanChainPosture.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanChainPosture.support is used through packages/motions/src/chain/HumanChainPosture.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanChainPosture.support is used through packages/motions/src/chain/HumanChainPosture.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanChainPosture.support is used through packages/motions/src/chain/HumanChainPosture.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanChainPosture.support is used through packages/motions/src/chain/HumanChainPosture.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanChainPosture.support is used through packages/motions/src/chain/HumanChainPosture.ts.
   */
  support(params: IAutoMovieMotionHumanSupport.IParams, anchor?: string): this;
}
