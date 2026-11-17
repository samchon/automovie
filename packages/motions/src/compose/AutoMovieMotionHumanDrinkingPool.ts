import type { IHumanBody } from "../body/IHumanBody";
import type { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { AutoMovieMotionHumanDrinkingArm } from "./AutoMovieMotionHumanDrinkingArm";
import { AutoMovieMotionHumanDrinkingSwivel } from "./AutoMovieMotionHumanDrinkingSwivel";
import { AutoMovieMotionHumanTouchUpright } from "./AutoMovieMotionHumanTouchUpright";

/**
 * What every candidate of one drinking search shares while the body, the
 * hand and the posture the arm is solved on stay fixed: the fitted-arm
 * reader, the drinking range's swivel bound and the nearest arm tried, so a
 * search over several sides of a vessel's rim (`handToFaceVessel`) prepares
 * them once and its refusal reports the nearest arm of every side.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is shared, under which fixed inputs, and who reads it.
 * @evidence contracts/development/design.md#principled-representation The pool is the search's fixed preparation and its one running minimum; no candidate's answer is in it.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One record and its constructor, read by `AutoMovieMotionHumanTouchDrink.drinking` and `handToFaceVessel`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The reader and the bound are their owners' (`AutoMovieMotionHumanDrinkingArm.prepareRead`, `AutoMovieMotionHumanDrinkingSwivel.bounded`), not restated.
 */
export namespace AutoMovieMotionHumanDrinkingPool {
  /**
   * One search's shared preparation and its nearest arm so far.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and lifetime.
   * @evidence contracts/development/design.md#principled-representation Two prepared readers of fixed inputs, the running nearest arm and the count of sides the refusal names.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Five members, each read by the drinking search.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Valid only for the body, hand and posture it was made for; the search that made it owns it.
   */
  export interface IPool {
    /** The fitted-arm reader of the fixed body and hand (`AutoMovieMotionHumanDrinkingArm.prepareRead`); every call still fits its own goal. */
    read: ReturnType<typeof AutoMovieMotionHumanDrinkingArm.prepareRead>;

    /**
     * The drinking range's swivel bound on the fixed posture (`AutoMovieMotionHumanDrinkingSwivel.bounded`), prepared at its first use.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States when the member is called and what it gives.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation A member's signature; `of`, which implements it, carries this claim.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure A member's signature; `of`, which implements it, carries this claim.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts A member's signature; `of`, which implements it, carries this claim.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A member's signature; `of`, which implements it, carries this claim.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A member's signature; `of`, which implements it, carries this claim.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A member's signature; `of`, which implements it, carries this claim.
     */
    bounds: () => ReturnType<typeof AutoMovieMotionHumanDrinkingSwivel.bounded>;

    /**
     * Whether a wrist's place, world metres, leaves any reaching elbow inside the drinking range on the fixed posture (`AutoMovieMotionHumanDrinkingSwivel.IRanged.admits`), the screen a candidate passes before its fit.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States when the member is called and what it gives.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation A member's signature; `of`, which implements it, carries this claim.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure A member's signature; `of`, which implements it, carries this claim.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts A member's signature; `of`, which implements it, carries this claim.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A member's signature; `of`, which implements it, carries this claim.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A member's signature; `of`, which implements it, carries this claim.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A member's signature; `of`, which implements it, carries this claim.
     */
    admits: () => AutoMovieMotionHumanDrinkingSwivel.IRanged["admits"];

    /** The arm tried so far that lies least past the drinking range (`AutoMovieMotionHumanDrinkingArm.nearer`); absent before the first. */
    nearest?: AutoMovieMotionHumanDrinkingArm.INearest;

    /** How many sides of the vessel's rim the search tries, 1 for a vessel whose side is fixed. */
    sides: number;

    /** The turn either way of head on the facings are tried within, degrees (`AutoMovieMotionHumanTouchUpright.facings`). */
    span: number;
  }

  /**
   * A pool for one search.
   *
   * @param body The body.
   * @param posture The posture the arm is solved on.
   * @param side The hand.
   * @param sides How many sides of the vessel's rim the search tries; 1 when absent.
   * @param span The facings' turn either way of head on, degrees; `AutoMovieMotionHumanTouchUpright.SPAN` when absent.
   * @returns The pool, its bound not yet prepared.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, their defaults and the lazy bound.
   * @evidence contracts/development/implementation.md#principled-implementation The reader and the bound depend on the body, the hand and the posture alone, so every candidate of one search reads the same ones.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One reader, one lazy bound, one count.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No candidate's fit is kept; the nearest arm is only the refusal's report.
   * @evidence contracts/development/implementation.md#efficient-algorithms One rig preparation and at most one trunk solve for the bound per search, however many sides, leans and facings it tries.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The fixed body, hand and posture decide equivalence; a search on another posture makes its own pool.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The search owns the pool until it returns or throws; it holds one reader, at most one bound and one nearest arm.
   */
  export function of(
    body: IHumanBody,
    posture: IHumanPosture,
    side: HumanHand.Side,
    sides: number = 1,
    span: number = AutoMovieMotionHumanTouchUpright.SPAN,
  ): IPool {
    let range: AutoMovieMotionHumanDrinkingSwivel.IRanged | undefined;
    const ranged: () => AutoMovieMotionHumanDrinkingSwivel.IRanged = (): AutoMovieMotionHumanDrinkingSwivel.IRanged =>
      (range ??= AutoMovieMotionHumanDrinkingSwivel.ranged(body, posture, side));
    return {
      read: AutoMovieMotionHumanDrinkingArm.prepareRead(body, side),
      bounds: (): ReturnType<typeof AutoMovieMotionHumanDrinkingSwivel.bounded> => ranged().hint,
      admits: (): AutoMovieMotionHumanDrinkingSwivel.IRanged["admits"] => ranged().admits,
      sides,
      span,
    };
  }
}
