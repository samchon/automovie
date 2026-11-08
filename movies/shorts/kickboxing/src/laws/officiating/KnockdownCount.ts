import type { RingFootwork } from "../kickboxing/RingFootwork";

/**
 * The knockdown procedure's clock and corner: one number per elapsed second
 * from the count's start, readiness assessed at eight, the knockout at ten,
 * and the farthest neutral corner from the fallen fighter.
 *
 * ```ts
 * KnockdownCount.number(157, 3); // 160, when "Three!" lands
 * KnockdownCount.corner(corners, fallen); // the far neutral corner
 * ```
 *
 * @evidence docs/research/kickboxing/rules.md#knockdown One number per elapsed second from the corner; readiness at eight; knockout at ten.
 * @evidence docs/research/officiating/referee.md#knockdown The farthest neutral corner from the fallen fighter.
 */
export namespace KnockdownCount {
  /** The last number of the count. */
  export const TEN: number = 10;

  /** The number at which readiness is assessed. */
  export const READINESS: number = 8;

  /**
   * The second a number lands.
   *
   * @param start The count's start: the standing fighter in the corner facing centre.
   * @param number A number from one to ten.
   * @returns Film seconds.
   * @evidence docs/research/kickboxing/rules.md#knockdown One number per elapsed second.
   */
  export function number(start: number, number: number): number {
    if (!Number.isInteger(number) || number < 1 || number > TEN)
      throw new Error(`A count number is one to ten: ${number}`);
    return start + number;
  }

  /**
   * The neutral corner farther from the fallen fighter.
   *
   * @param corners The two neutral corners' points.
   * @param fallen The fallen fighter's position.
   * @returns The farther corner.
   * @evidence docs/research/officiating/referee.md#knockdown The farthest neutral corner.
   */
  export function corner(
    corners: readonly [RingFootwork.IPoint, RingFootwork.IPoint],
    fallen: RingFootwork.IPoint,
  ): RingFootwork.IPoint {
    const d = (p: RingFootwork.IPoint): number =>
      Math.hypot(p.x - fallen.x, p.z - fallen.z);
    return d(corners[0]) >= d(corners[1]) ? corners[0] : corners[1];
  }
}
