import type { IAutoMovieMotionHumanBrace } from "../everyday/IAutoMovieMotionHumanBrace";
import type { IAutoMovieMotionHumanClinch } from "../grappling/IAutoMovieMotionHumanClinch";
import type { IAutoMovieMotionHumanFlinch } from "../reaction/IAutoMovieMotionHumanFlinch";
import type { IAutoMovieMotionHumanKnockdown } from "../reaction/IAutoMovieMotionHumanKnockdown";
import type { IAutoMovieMotionHumanPerturb } from "../reaction/IAutoMovieMotionHumanPerturb";
import type { IAutoMovieMotionHumanStagger } from "../reaction/IAutoMovieMotionHumanStagger";
import type { IAutoMovieMotionHumanDefend } from "../striking/IAutoMovieMotionHumanDefend";
import type { IAutoMovieMotionHumanGuard } from "../striking/IAutoMovieMotionHumanGuard";
import type { IAutoMovieMotionHumanKick } from "../striking/IAutoMovieMotionHumanKick";
import type { IAutoMovieMotionHumanKnee } from "../striking/IAutoMovieMotionHumanKnee";
import type { IAutoMovieMotionHumanPunch } from "../striking/IAutoMovieMotionHumanPunch";
import type { IAutoMovieMotionHumanStep } from "../striking/IAutoMovieMotionHumanStep";
import type { IAutoMovieMotionHumanChainManual } from "./IAutoMovieMotionHumanChainManual";

/**
 * The chain methods of a fight and of what a force does to a body: the
 * guard and its footwork, the strikes, the clinch, the defences, and the
 * reactions to a threat, a push or a blow.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the family and documents each method.
 * @evidence contracts/development/design.md#principled-representation One method per action of the family, each `act` under the action's name.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The striking, defence and reaction actions only.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every method takes its law's own parameter type.
 */
export interface IAutoMovieMotionHumanChainStriking extends IAutoMovieMotionHumanChainManual {
  /**
   * Take and hold the fighting stance with the gloves up.
   *
   * @param params Stance, facing and time held.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanChainStriking.guard: Take and hold the fighting stance with the gloves up.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanChainStriking.guard is used through packages/motions/src/chain/HumanChainStriking.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanChainStriking.guard is used through packages/motions/src/chain/HumanChainStriking.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanChainStriking.guard is used through packages/motions/src/chain/HumanChainStriking.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanChainStriking.guard is used through packages/motions/src/chain/HumanChainStriking.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanChainStriking.guard is used through packages/motions/src/chain/HumanChainStriking.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanChainStriking.guard is used through packages/motions/src/chain/HumanChainStriking.ts.
   */
  guard(params?: IAutoMovieMotionHumanGuard.IParams, anchor?: string): this;

  /**
   * Step in the fighting stance, keeping the stance.
   *
   * @param params Direction, count and length.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanChainStriking.step: Step in the fighting stance, keeping the stance.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanChainStriking.step is used through packages/motions/src/chain/HumanChainStriking.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanChainStriking.step is used through packages/motions/src/chain/HumanChainStriking.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanChainStriking.step is used through packages/motions/src/chain/HumanChainStriking.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanChainStriking.step is used through packages/motions/src/chain/HumanChainStriking.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanChainStriking.step is used through packages/motions/src/chain/HumanChainStriking.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanChainStriking.step is used through packages/motions/src/chain/HumanChainStriking.ts.
   */
  step(params: IAutoMovieMotionHumanStep.IParams, anchor?: string): this;

  /**
   * Bring a straight, hook or uppercut onto a target, or feint one.
   *
   * @param params Hand, technique and target.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanChainStriking.punch: Bring a straight, hook or uppercut onto a target, or feint one.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanChainStriking.punch is used through packages/motions/src/chain/HumanChainStriking.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanChainStriking.punch is used through packages/motions/src/chain/HumanChainStriking.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanChainStriking.punch is used through packages/motions/src/chain/HumanChainStriking.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanChainStriking.punch is used through packages/motions/src/chain/HumanChainStriking.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanChainStriking.punch is used through packages/motions/src/chain/HumanChainStriking.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanChainStriking.punch is used through packages/motions/src/chain/HumanChainStriking.ts.
   */
  punch(params: IAutoMovieMotionHumanPunch.IParams, anchor?: string): this;

  /**
   * Bring a round kick's shin or a push kick's foot onto a target, or feint
   * one.
   *
   * @param params Leg, technique and target.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanChainStriking.kick: Bring a round kick's shin or a push kick's foot onto a target, or feint one.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanChainStriking.kick is used through packages/motions/src/chain/HumanChainStriking.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanChainStriking.kick is used through packages/motions/src/chain/HumanChainStriking.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanChainStriking.kick is used through packages/motions/src/chain/HumanChainStriking.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanChainStriking.kick is used through packages/motions/src/chain/HumanChainStriking.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanChainStriking.kick is used through packages/motions/src/chain/HumanChainStriking.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanChainStriking.kick is used through packages/motions/src/chain/HumanChainStriking.ts.
   */
  kick(params: IAutoMovieMotionHumanKick.IParams, anchor?: string): this;

  /**
   * Drive a knee onto a target, in the clinch or free.
   *
   * @param params The target and the leg.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanChainStriking.knee: Drive a knee onto a target, in the clinch or free.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanChainStriking.knee is used through packages/motions/src/chain/HumanChainStriking.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanChainStriking.knee is used through packages/motions/src/chain/HumanChainStriking.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanChainStriking.knee is used through packages/motions/src/chain/HumanChainStriking.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanChainStriking.knee is used through packages/motions/src/chain/HumanChainStriking.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanChainStriking.knee is used through packages/motions/src/chain/HumanChainStriking.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanChainStriking.knee is used through packages/motions/src/chain/HumanChainStriking.ts.
   */
  knee(params: IAutoMovieMotionHumanKnee.IParams, anchor?: string): this;

  /**
   * Take and hold a clinch grip on a partner: the neck tie, or collar and
   * sleeve.
   *
   * @param params The partner, the grip, the hand and the hold.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanChainStriking.clinch: Take and hold a clinch grip on a partner: the neck tie, or collar and sleeve.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanChainStriking.clinch is used through packages/motions/src/chain/HumanChainStriking.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanChainStriking.clinch is used through packages/motions/src/chain/HumanChainStriking.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanChainStriking.clinch is used through packages/motions/src/chain/HumanChainStriking.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanChainStriking.clinch is used through packages/motions/src/chain/HumanChainStriking.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanChainStriking.clinch is used through packages/motions/src/chain/HumanChainStriking.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanChainStriking.clinch is used through packages/motions/src/chain/HumanChainStriking.ts.
   */
  clinch(params: IAutoMovieMotionHumanClinch.IParams, anchor?: string): this;

  /**
   * Defend against one placed strike: a cover, parry, block, check or
   * evasion.
   *
   * @param params The attack answered and the defence.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanChainStriking.defend: Defend against one placed strike: a cover, parry, block, check or evasion.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanChainStriking.defend is used through packages/motions/src/chain/HumanChainStriking.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanChainStriking.defend is used through packages/motions/src/chain/HumanChainStriking.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanChainStriking.defend is used through packages/motions/src/chain/HumanChainStriking.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanChainStriking.defend is used through packages/motions/src/chain/HumanChainStriking.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanChainStriking.defend is used through packages/motions/src/chain/HumanChainStriking.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanChainStriking.defend is used through packages/motions/src/chain/HumanChainStriking.ts.
   */
  defend(params: IAutoMovieMotionHumanDefend.IParams, anchor?: string): this;

  /**
   * Brace for an expected impact, push or falling body.
   *
   * @param params Where the force comes from, what it is and how long.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanChainStriking.brace: Brace for an expected impact, push or falling body.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanChainStriking.brace is used through packages/motions/src/chain/HumanChainStriking.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanChainStriking.brace is used through packages/motions/src/chain/HumanChainStriking.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanChainStriking.brace is used through packages/motions/src/chain/HumanChainStriking.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanChainStriking.brace is used through packages/motions/src/chain/HumanChainStriking.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanChainStriking.brace is used through packages/motions/src/chain/HumanChainStriking.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanChainStriking.brace is used through packages/motions/src/chain/HumanChainStriking.ts.
   */
  brace(params?: IAutoMovieMotionHumanBrace.IParams, anchor?: string): this;

  /**
   * Startle away from a threat or a blow.
   *
   * @param params The threat and its intensity.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanChainStriking.flinch: Startle away from a threat or a blow.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanChainStriking.flinch is used through packages/motions/src/chain/HumanChainStriking.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanChainStriking.flinch is used through packages/motions/src/chain/HumanChainStriking.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanChainStriking.flinch is used through packages/motions/src/chain/HumanChainStriking.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanChainStriking.flinch is used through packages/motions/src/chain/HumanChainStriking.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanChainStriking.flinch is used through packages/motions/src/chain/HumanChainStriking.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanChainStriking.flinch is used through packages/motions/src/chain/HumanChainStriking.ts.
   */
  flinch(params?: IAutoMovieMotionHumanFlinch.IParams, anchor?: string): this;

  /**
   * Take one unplanned capture step after a push.
   *
   * @param params The push.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanChainStriking.stagger: Take one unplanned capture step after a push.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanChainStriking.stagger is used through packages/motions/src/chain/HumanChainStriking.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanChainStriking.stagger is used through packages/motions/src/chain/HumanChainStriking.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanChainStriking.stagger is used through packages/motions/src/chain/HumanChainStriking.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanChainStriking.stagger is used through packages/motions/src/chain/HumanChainStriking.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanChainStriking.stagger is used through packages/motions/src/chain/HumanChainStriking.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanChainStriking.stagger is used through packages/motions/src/chain/HumanChainStriking.ts.
   */
  stagger(params: IAutoMovieMotionHumanStagger.IParams, anchor?: string): this;

  /**
   * Let the legs give way and go down to lie supine.
   *
   * @param params The cause and direction.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanChainStriking.knockdown: Let the legs give way and go down to lie supine.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanChainStriking.knockdown is used through packages/motions/src/chain/HumanChainStriking.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanChainStriking.knockdown is used through packages/motions/src/chain/HumanChainStriking.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanChainStriking.knockdown is used through packages/motions/src/chain/HumanChainStriking.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanChainStriking.knockdown is used through packages/motions/src/chain/HumanChainStriking.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanChainStriking.knockdown is used through packages/motions/src/chain/HumanChainStriking.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanChainStriking.knockdown is used through packages/motions/src/chain/HumanChainStriking.ts.
   */
  knockdown(
    params?: IAutoMovieMotionHumanKnockdown.IParams,
    anchor?: string,
  ): this;

  /**
   * Respond to the impulses on the body: absorb, step or fall as the
   * impulse decides, or as the author fixes (#3430).
   *
   * @param params The outcome; decided by the impulse when absent.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanChainStriking.perturb: Respond to the impulses on the body: absorb, step or fall as the impulse decides, or as the author fixes (#3430).
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanChainStriking.perturb is used through packages/motions/src/chain/HumanChainStriking.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanChainStriking.perturb is used through packages/motions/src/chain/HumanChainStriking.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanChainStriking.perturb is used through packages/motions/src/chain/HumanChainStriking.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanChainStriking.perturb is used through packages/motions/src/chain/HumanChainStriking.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanChainStriking.perturb is used through packages/motions/src/chain/HumanChainStriking.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanChainStriking.perturb is used through packages/motions/src/chain/HumanChainStriking.ts.
   */
  perturb(params?: IAutoMovieMotionHumanPerturb.IParams, anchor?: string): this;
}
