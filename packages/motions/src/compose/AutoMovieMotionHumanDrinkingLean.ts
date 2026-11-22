import type { IAutoMovieMotionHumanDrinkingArm } from "@automovie/interface";

import { AutoMovieMotionHumanDrinkingArm } from "./AutoMovieMotionHumanDrinkingArm";

/**
 * The leans toward the face a drinking vessel is tried at: their step, their
 * bound and the walk that finds the least one an arm is admitted at
 * (`AutoMovieMotionHumanTouchDrink` admits each).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the namespace holds and who admits a lean.
 * @evidence contracts/development/design.md#principled-representation A lean is a number of degrees on a grid of one step, bounded by the vessel's own geometry.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The step, the bound and the walk, read by the two drinking searches; split from them so each file holds one responsibility.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The walk knows no arm: it reads an attempt's answer and the miss the attempt measured.
 */
export namespace AutoMovieMotionHumanDrinkingLean {
  /** The step between the leans toward the face a held vessel is tried at, degrees (provisional). */
  export const STEP: number = 5;

  /**
   * The most a held vessel is leaned toward the face to let the arm hold it
   * as a drinker does, degrees: the lean that lays its wall level. A liquid
   * at rest keeps a level surface, so a vessel of height `H` and radius `r`
   * filled to a share `f` of its height first brings that surface to its rim
   * at a lean of `atan((1 - f) H / r)`, and the last of what it holds
   * reaches the rim when the wall is level, at 90 degrees. A drinker leans
   * the vessel through that whole range as it empties, so pouring rules out
   * no lean below it; past it nothing more reaches the lips. The drinking
   * studies the drinking arm cites (Alt Murphy et al. 2006; Murphy, Willén
   * and Sunnerhagen 2011) report the arm's joints and not the vessel's lean,
   * and a search for a measured lean found none, so the bound is the
   * geometry's. An earlier bound of 60 degrees, set as "past it the vessel
   * pours", refused a glass the wrist holds at about 69.5 degrees (measured:
   * its deviation at the range's end, the vessel's axis 54.7, 38.9, 25.0 and
   * 10.2 degrees off the asked one at leans of 15, 30, 45 and 60).
   */
  export const MOST: number = 90;

  /** The step between the leans the walk tries first, degrees, inside whose first admitting bracket it tries every {@link STEP} (provisional). */
  export const COARSE: number = 15;

  /**
   * What one lean's attempt saw of the arms it tried, for the walk.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states when it is called and what it gives.
   * @evidence contracts/development/design.md#principled-representation One number per attempt: the least miss among the arms that drink.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Three members: the attempt begins and shows its arms, the walk reads the miss.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Nothing of an earlier attempt is kept past the next one's start.
   */
  export interface IMisses {
    /**
     * Forget the last attempt's arms; called when an attempt starts.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States when the member is called and what it gives.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation A member's signature; `misses`, which implements it, carries this claim.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure A member's signature; `misses`, which implements it, carries this claim.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts A member's signature; `misses`, which implements it, carries this claim.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A member's signature; `misses`, which implements it, carries this claim.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A member's signature; `misses`, which implements it, carries this claim.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A member's signature; `misses`, which implements it, carries this claim.
     */
    begin: () => void;

    /**
     * Show an arm the attempt tried.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States when the member is called and what it gives.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation A member's signature; `misses`, which implements it, carries this claim.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure A member's signature; `misses`, which implements it, carries this claim.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts A member's signature; `misses`, which implements it, carries this claim.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A member's signature; `misses`, which implements it, carries this claim.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A member's signature; `misses`, which implements it, carries this claim.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A member's signature; `misses`, which implements it, carries this claim.
     */
    see: (arm: IAutoMovieMotionHumanDrinkingArm.IArm) => void;

    /**
     * The least miss of the vessel's axis among the arms shown since the start that drink, degrees; none when none drinks.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States when the member is called and what it gives.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation A member's signature; `misses`, which implements it, carries this claim.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure A member's signature; `misses`, which implements it, carries this claim.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts A member's signature; `misses`, which implements it, carries this claim.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A member's signature; `misses`, which implements it, carries this claim.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A member's signature; `misses`, which implements it, carries this claim.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A member's signature; `misses`, which implements it, carries this claim.
     */
    least: () => number | undefined;
  }

  /**
   * A reader of the arms one lean's attempt tried.
   *
   * @returns The reader, holding nothing yet.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the result; the interface states each member.
   * @evidence contracts/development/implementation.md#principled-implementation Only an arm that drinks counts: one outside the shoulder's range is not refused for the hand's turn, so its miss says nothing of the lean.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One kept number and three closures.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work per arm.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One number, released with the search that made the reader.
   */
  export function misses(): IMisses {
    let miss: number | undefined;
    return {
      begin: (): void => {
        miss = undefined;
      },
      see: (arm: IAutoMovieMotionHumanDrinkingArm.IArm): void => {
        if (
          AutoMovieMotionHumanDrinkingArm.drinks(arm) &&
          (miss === undefined || arm.tilt < miss)
        )
          miss = arm.tilt;
      },
      least: (): number | undefined => miss,
    };
  }

  /**
   * The least lean an attempt admits, in {@link STEP} degrees up to
   * {@link MOST}: every {@link COARSE} degrees first, then every step from
   * the bracket's low end up to the coarse lean that admitted, which returns
   * the least admitting lean when admission holds at every lean above the
   * least one inside the bracket.
   *
   * A coarse lean may fail only because the hand cannot turn the vessel to
   * it: its arm drinks, but a joint of the wrist stands at its range's end
   * and holds the vessel's axis some degrees off the asked one. That hand
   * holds one axis whatever lean is asked, so the miss falls a degree for
   * each degree of lean and is zero at the coarse lean plus the miss
   * (measured on a held glass: 54.7, 38.9, 25.0 and 10.2 degrees off at
   * leans of 15, 30, 45 and 60, so 69.7, 68.9, 70.0 and 70.2). Once two
   * coarse leans in a row place that zero within a step of each other, the
   * grid's leans within a step of it are tried at once, nearest it first: the
   * window an arm is admitted in is two steps wide and may hold no coarse
   * lean, and past it the miss grows again, so the coarse walk alone steps
   * over it.
   *
   * @param attempt One lean's admission: its answer, or none.
   * @param off After an attempt, the least miss of the vessel's axis among the arms it tried that drink, degrees; none when no arm it tried drinks.
   * @returns The answer at the least lean admitted; none when no lean tried admits.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the order, the assumption, the closed form with its measurement and each argument.
   * @evidence contracts/development/implementation.md#principled-implementation The miss of a hand at a joint's end is linear in the lean with slope minus one, so its zero is read from one attempt; the grid's leans about it are attempted, never assumed.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One coarse loop with the closed-form window on a miss and the fine bracket on an admission.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every returned lean was attempted and admitted; the zero is read only where two coarse leans in a row agree on it, so a miss that does not fall with the lean (an unsigned miss of a hand below the asked lean rises with it) opens no window.
   * @evidence contracts/development/implementation.md#efficient-algorithms At most seven coarse attempts, three in each agreed window and two fine ones; a held glass admitted near 70 degrees is found after the second coarse lean whose arm drinks, where the walk tried every coarse lean and found none; a hand no lean admits costs the coarse attempts alone.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work No lean is attempted twice within one walk; nothing is kept beyond it.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The set of tried leans, at most nineteen numbers, ends with the call.
   */
  export function least<T>(
    attempt: (lean: number) => T | undefined,
    off: () => number | undefined,
  ): T | undefined {
    const tried: Set<number> = new Set();
    const once = (lean: number): T | undefined => {
      tried.add(lean);
      return attempt(lean);
    };
    let before: number | undefined;
    for (let coarse: number = 0; coarse <= MOST + 1e-9; coarse += COARSE) {
      if (tried.has(coarse)) continue;
      const found: T | undefined = once(coarse);
      if (found === undefined) {
        const miss: number | undefined = off();
        if (miss === undefined || !(miss > STEP)) {
          before = undefined;
          continue;
        }

        // The zero is trusted only when two coarse leans in a row place it
        // within a step of each other: that is what a miss falling a degree
        // a degree of lean gives, and a hand that misses for another reason
        // costs no attempt beyond the coarse ones.
        const exact: number = coarse + miss;
        const agreed: boolean =
          before !== undefined && Math.abs(exact - before) <= STEP;
        before = exact;
        if (!agreed) continue;

        // The grid's lean nearest the zero first: a hand at its joint's end
        // shows the vessel at the zero's lean whatever is asked, so the lean
        // asked nearest it is the one the hand holds as asked, and a lean a
        // step short of it only adds that step to the goal's own miss (the
        // vessel's point then stands off its region by the miss times its
        // distance from the wrist, which the arm's plan cannot close).
        const window: number[] = [];
        for (
          let fine: number = Math.ceil((exact - STEP) / STEP - 1e-9) * STEP;
          fine <= Math.min(MOST, exact + STEP) + 1e-9;
          fine += STEP
        )
          if (fine > coarse && !tried.has(fine)) window.push(fine);
        window.sort(
          (a: number, b: number): number =>
            Math.abs(a - exact) - Math.abs(b - exact) || a - b,
        );
        for (const fine of window) {
          const reached: T | undefined = once(fine);
          if (reached !== undefined) return reached;
        }
        continue;
      }
      for (
        let fine: number = Math.max(0, coarse - COARSE + STEP);
        fine < coarse - 1e-9;
        fine += STEP
      ) {
        if (tried.has(fine)) continue;
        const finer: T | undefined = once(fine);
        if (finer !== undefined) return finer;
      }
      return found;
    }
    return undefined;
  }
}
