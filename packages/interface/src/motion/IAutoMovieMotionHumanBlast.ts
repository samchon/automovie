import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { AutoMovieMotionHumanScheduledInstant } from "./AutoMovieMotionHumanScheduledInstant";

/**
 * A blast: a point and an instant from which an impulse reaches every person
 * whose colliders lie within a radius, falling with distance. A grenade's
 * burst, a shell's, a charge's.
 *
 * Each person reached receives one hit (`HumanPerformance.hits`), source
 * `impactOutput`, whose impulse points from the blast's point to the nearest
 * point of their colliders. The impulse's magnitude is `impulse` at the
 * reference distance of one metre and falls as the inverse square of the
 * distance beyond it, the spreading of a spherical front's energy; no
 * blast-loading source has been read for it (Kingery and Bulmash's scaled
 * impulse curves are the reference to read), so the falloff is provisional and
 * only its monotone fall is relied on.
 */
export namespace IAutoMovieMotionHumanBlast {
  /**
   * The impulse's magnitude at a distance from the centre: the reference
   * impulse within the reference distance, falling as the inverse square of the
   * distance beyond it (provisional). A blast.
   */
  export interface IBlast {
    /** Its id, unique among the blasts; the hit's `object`. */
    id: string;

    /** Its centre, world metres. */
    point: IAutoMovieVector3;

    /** Film second it bursts, or a named instant of an action or a cue track. */
    at: AutoMovieMotionHumanScheduledInstant;

    /** How far it reaches, metres; positive. */
    radius: number;

    /**
     * The impulse it delivers one metre from its centre, newton seconds;
     * positive.
     */
    impulse: number;
  }
}
