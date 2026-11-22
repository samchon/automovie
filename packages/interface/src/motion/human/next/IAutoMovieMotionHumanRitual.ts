import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";

/**
 * Devotional acts composed from shipped actions (#3985): the sign of the cross, a genuflection and a kneeling prayer. Each appends shipped touch, kneel and gesture actions to the performer's chain, so they are fitted, refused and checked as those actions are.
 *
 * The sign of the cross touches the forehead, the sternum and both shoulders with the fingertips, in that order; the Latin rite crosses the shoulders left then right, the Byzantine rite right then left. A genuflection lowers the right knee to the floor beside the left heel and rises at once (General Instruction of the Roman Missal, no. 274), optionally signing the cross first. A kneeling prayer kneels on both knees with the palms together before the chest for the authored hold, then rises. The timings are the namespace constants `TOUCH_HOLD`, `SITE` and `GENUFLECT_HOLD` of `AutoMovieMotionHumanRitual` (provisional).
 *
 * Each method is a helper over a chain: it takes the chain first and returns it with the actions appended, as the runtime namespace takes it.
 *
 * @template Chain The chain every method takes and returns.
 * @evidence contracts/development/common.md#meaningful-documentation States the family's shared model, each act and its order.
 * @evidence contracts/development/design.md#principled-representation One method per act of the Ritual behaviour, each taking one named parameter type.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The compositions the ritual scenes use and nothing the other families own.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No posture is authored here; the touch, kneel and gesture laws plan and refuse.
 */
export interface IAutoMovieMotionHumanRitual<Chain> {
  /**
   * Sign the cross: forehead, sternum, then both shoulders in the rite's order, with one hand's fingertips.
   *
   * @param chain The performer's chain.
   * @param params The `hand` and `rite` of `IAutoMovieMotionHumanRitual.ISignOfCross`.
   * @returns The chain with four touches appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the order, the hand and the rite.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanRitual.signOfCross is provided by the chain that implements IAutoMovieMotionHumanRitual.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanRitual.signOfCross is provided by the chain that implements IAutoMovieMotionHumanRitual.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanRitual.signOfCross is provided by the chain that implements IAutoMovieMotionHumanRitual.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanRitual.signOfCross is provided by the chain that implements IAutoMovieMotionHumanRitual.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanRitual.signOfCross is provided by the chain that implements IAutoMovieMotionHumanRitual.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanRitual.signOfCross is provided by the chain that implements IAutoMovieMotionHumanRitual.
   */
  signOfCross(
    chain: Chain,
    params: IAutoMovieMotionHumanRitual.ISignOfCross,
  ): Chain;

  /**
   * Genuflect: the right knee to the floor beside the left heel, a brief rest, and the rise, with an optional sign of the cross first.
   *
   * @param chain The performer's chain.
   * @param params The `cross` of `IAutoMovieMotionHumanRitual.IGenuflect`.
   * @returns The chain with the genuflection appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States which knee lowers, the rest and the option.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanRitual.genuflect is provided by the chain that implements IAutoMovieMotionHumanRitual.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanRitual.genuflect is provided by the chain that implements IAutoMovieMotionHumanRitual.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanRitual.genuflect is provided by the chain that implements IAutoMovieMotionHumanRitual.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanRitual.genuflect is provided by the chain that implements IAutoMovieMotionHumanRitual.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanRitual.genuflect is provided by the chain that implements IAutoMovieMotionHumanRitual.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanRitual.genuflect is provided by the chain that implements IAutoMovieMotionHumanRitual.
   */
  genuflect(
    chain: Chain,
    params: IAutoMovieMotionHumanRitual.IGenuflect,
  ): Chain;

  /**
   * Pray kneeling: both knees down with the palms together before the chest for the hold, then the rise.
   *
   * @param chain The performer's chain.
   * @param params The `hold` of `IAutoMovieMotionHumanRitual.IKneelingPrayer`.
   * @param anchor The kneel's anchor the gesture syncs to; `kneelingPrayer` when absent. A chain that prays more than once gives each prayer its own.
   * @returns The chain with the prayer appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the posture, the hands, the hold and the anchor.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanRitual.kneelingPrayer is provided by the chain that implements IAutoMovieMotionHumanRitual.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanRitual.kneelingPrayer is provided by the chain that implements IAutoMovieMotionHumanRitual.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanRitual.kneelingPrayer is provided by the chain that implements IAutoMovieMotionHumanRitual.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanRitual.kneelingPrayer is provided by the chain that implements IAutoMovieMotionHumanRitual.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanRitual.kneelingPrayer is provided by the chain that implements IAutoMovieMotionHumanRitual.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanRitual.kneelingPrayer is provided by the chain that implements IAutoMovieMotionHumanRitual.
   */
  kneelingPrayer(
    chain: Chain,
    params: IAutoMovieMotionHumanRitual.IKneelingPrayer,
    anchor?: string,
  ): Chain;
}

/**
 * The parameter types of the Ritual methods.
 */
export namespace IAutoMovieMotionHumanRitual {
  /**
   * Which shoulder the sign of the cross touches first: the Latin rite's left or the Byzantine rite's right.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names each rite and its shoulder order.
   * @evidence contracts/development/design.md#principled-representation The closed choice of the two shoulder orders.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only the rites `signOfCross` reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted literals are the two traditions' orders.
   */
  export type IRite = "latin" | "byzantine";

  /**
   * The self regions the sign of the cross touches.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names each region.
   * @evidence contracts/development/design.md#principled-representation The four regions the sign touches, in the body's own region names.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only the regions `signOfCross` touches.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The regions are the body's region names.
   */
  export type ICrossRegion =
    | "forehead"
    | "sternum"
    | "shoulderLeft"
    | "shoulderRight";

  /**
   * The parameters of `signOfCross`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and default.
   * @evidence contracts/development/design.md#principled-representation The signing hand and the rite.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only the members `signOfCross` reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The hand and the rite are closed choices.
   */
  export interface ISignOfCross {
    /** The signing hand; the right when absent. */
    hand?: AutoMovieHumanSide;

    /** The shoulder order; the Latin rite when absent. */
    rite?: IRite;
  }

  /**
   * The parameters of `genuflect`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The member states its meaning and default.
   * @evidence contracts/development/design.md#principled-representation The one option of the genuflection.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only the member `genuflect` reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The option is a flag, not a pose.
   */
  export interface IGenuflect {
    /** Whether to sign the cross before kneeling; `false` when absent. */
    cross?: boolean;
  }

  /**
   * The parameters of `kneelingPrayer`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The member states its meaning and unit.
   * @evidence contracts/development/design.md#principled-representation The authored hold of the prayer.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only the member `kneelingPrayer` reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The hold is authored, not derived.
   */
  export interface IKneelingPrayer {
    /** Seconds kneeling in prayer. */
    hold: number;
  }
}
