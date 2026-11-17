import type { IAutoMovieMotionHumanBlast } from "@automovie/interface";

/**
 * A blast: a point and an instant from which an impulse reaches every
 * person whose colliders lie within a radius, falling with distance. A
 * grenade's burst, a shell's, a charge's.
 *
 * Each person reached receives one hit (`HumanPerformance.hits`), source
 * `impactOutput`, whose impulse points from the blast's point to the
 * nearest point of their colliders. The impulse's magnitude is `impulse` at
 * the reference distance of one metre and falls as the inverse square of the
 * distance beyond it, the spreading of a spherical front's energy; no
 * blast-loading source has been read for it (Kingery and Bulmash's scaled
 * impulse curves are the reference to read), so the falloff is provisional
 * and only its monotone fall is relied on.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what a blast reaches, the hit it gives, the falloff and that it is provisional with the source to read.
 * @evidence contracts/development/design.md#principled-representation A point, an instant, a radius and a reference impulse.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The blast record and its falloff, read by the hit record.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No charge is named: the impulse and radius are the author's.
 */
export namespace HumanBlast {

  /** The reference distance the impulse is stated at, metres. */
  export const REFERENCE: number = 1;

  /**
   * The impulse's magnitude at a distance from the centre: the reference
   * impulse within the reference distance, falling as the inverse square of
   * the distance beyond it (provisional).
   *
   * @param blast The blast.
   * @param distance Metres from its centre.
   * @returns Newton seconds.
   */
  export function impulse(blast: IAutoMovieMotionHumanBlast.IBlast, distance: number): number {
    const d: number = Math.max(REFERENCE, distance);
    return blast.impulse * (REFERENCE / d) ** 2;
  }
}
