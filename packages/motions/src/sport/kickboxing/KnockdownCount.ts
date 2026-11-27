import type {
  IAutoMovieMotionHumanKickboxingRing,
  IAutoMovieVector3,
} from "@automovie/interface";

import { KickboxingRing } from "./KickboxingRing";

/*
 * The knockdown procedure's clock and corner (GLORY Rules 5.05.B.2 to 5 and
 * Appendix 3.D, as inspected in the kickboxing research): the standing fighter
 * goes to the farthest neutral corner and faces the centre before the count
 * starts; the count is one number per elapsed second from that start, readiness
 * is assessed at eight, and an uninterrupted ten ends the contest by knockout.
 * One number per second is the research's implementation of the ten-count, not
 * a timing the rulebook quotes.
 */
export namespace KnockdownCount {
  /*
   * The last number of the count.
   */
  export const TEN: number = 10;

  /*
   * The number at which readiness is assessed.
   */
  export const READINESS: number = 8;

  /*
   * The second a number lands.
   * Parameter start: Film second the count starts (the standing fighter in the
   * corner).
   * Parameter number: A whole number from one to ten.
   * Returns: Film seconds.
   * When the number is not one to ten.
   */
  export function number(start: number, number: number): number {
    if (!(number >= 1 && number <= TEN))
      throw new Error(`A count number is one to ten: ${number}`);
    return start + number;
  }

  /*
   * The neutral corner farther from the fallen fighter.
   * Parameter ring: The ring.
   * Parameter fallen: The fallen fighter's floor point, world metres.
   * Parameter margin: How far inside the ropes the standing fighter waits, metres.
   * Returns: The corner's floor point, world metres.
   */
  export function corner(
    ring: IAutoMovieMotionHumanKickboxingRing.IRing,
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
    const d: (p: IAutoMovieVector3) => number = (
      p: IAutoMovieVector3,
    ): number => Math.hypot(p.x - fallen.x, p.z - fallen.z);
    return d(a) >= d(b) ? a : b;
  }
}
