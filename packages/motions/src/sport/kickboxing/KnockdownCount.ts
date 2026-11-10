import type { IAutoMovieVector3 } from "@automovie/interface";

import { KickboxingRing } from "./KickboxingRing";

/**
 * The knockdown procedure's clock and corner (GLORY Rules 5.05.B.2 to 5 and
 * Appendix 3.D, as inspected in the kickboxing research of #3201): the
 * standing fighter goes to the farthest neutral corner and faces the centre
 * before the count starts; the count is one number per elapsed second from
 * that start, readiness is assessed at eight, and an uninterrupted ten ends
 * the contest by knockout. One number per second is the research's
 * implementation of the ten-count, not a timing the rulebook quotes.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the procedure with its rule numbers and which timing is the research's own reading.
 * @evidence contracts/development/design.md#principled-representation The count as film seconds from its start and the corner as a floor point of the ring.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The two count constants and the two queries staging reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the ring and the interface vector.
 */
export namespace KnockdownCount {
  /** The last number of the count. */
  export const TEN: number = 10;

  /** The number at which readiness is assessed. */
  export const READINESS: number = 8;

  /**
   * The second a number lands.
   *
   * @param start Film second the count starts (the standing fighter in the corner).
   * @param number A whole number from one to ten.
   * @returns Film seconds.
   * @throws {Error} When the number is not one to ten.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the timebase, the domain and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation One number per elapsed second from the count's start, the research's reading of the ten-count.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One check and one sum.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A number outside one to ten throws.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function number(start: number, number: number): number {
    if (!Number.isInteger(number) || number < 1 || number > TEN)
      throw new Error(`A count number is one to ten: ${number}`);
    return start + number;
  }

  /**
   * The neutral corner farther from the fallen fighter.
   *
   * @param ring The ring.
   * @param fallen The fallen fighter's floor point, world metres.
   * @param margin How far inside the ropes the standing fighter waits, metres.
   * @returns The corner's floor point, world metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the choice, the margin and the units.
   * @evidence contracts/development/implementation.md#principled-implementation The farther of the two neutral corners by horizontal distance from the fallen fighter, ties to the first.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two ring corner queries and one comparison.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function corner(
    ring: KickboxingRing.IRing,
    fallen: IAutoMovieVector3,
    margin: number = 0,
  ): IAutoMovieVector3 {
    const a: IAutoMovieVector3 = KickboxingRing.corner(
      ring,
      "neutralA",
      margin,
    );
    const b: IAutoMovieVector3 = KickboxingRing.corner(
      ring,
      "neutralB",
      margin,
    );
    const d = (p: IAutoMovieVector3): number =>
      Math.hypot(p.x - fallen.x, p.z - fallen.z);
    return d(a) >= d(b) ? a : b;
  }
}
