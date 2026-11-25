import type { IAutoMovieMotionHumanFoot } from "../posture/IAutoMovieMotionHumanFoot";

/**
 * One foot of a stepping gait at an instant: the rockers of its stance on a
 * footprint and its swing between two reached stances.
 *
 * In stance a foot rolls on its heel from 15° toes-up to flat over 12 % of the
 * stance and, from 60 % of it, on its ball to its push pitch at toe-off
 * (provisional angles inside the ranges of Perry and Burnfield's rockers), the
 * toes extending at the ball by the same angle so they stay flat on the floor.
 * The forefoot rocker starts at rest and ends still turning (`LEAVE`), the rate
 * the swing then carries on from. In swing the ankle leaves the placement and
 * the velocity its stance ended with and arrives at rest on the placement its
 * next stance begins with, on a quintic Hermite curve (the minimum-jerk profile
 * of Flash and Hogan 1985 plus the engine's `carriedRate` term for the initial
 * velocity), lifted at mid-swing on a raised-cosine bump, `sin²(π u)`, whose
 * slope is zero at both ends, so the lift adds no velocity at toe-off and the
 * foot meets the floor at rest (the heel's vertical velocity at contact is near
 * zero, Winter 1992), and raised further wherever the toe or heel would come
 * within `CLEARANCE` of the floor. The travel, the turn and the descent of the
 * placements end early, at the share of the swing where the lift has fallen to
 * the contact height of the floor (`AutoMovieMotionHumanAuditContact.HEIGHT`,
 * half the minimum toe clearance): in terminal swing the foot comes to rest
 * over its landing and only then sets down, the heel's horizontal velocity
 * falling through terminal swing as it descends (Winter 1992), so no sole is on
 * the floor while it still travels. The toes relax over the first half and take
 * the landing's flexion over the second.
 */
export namespace IAutoMovieMotionHumanWalkFoot {
  /**
   * A foot as its schedule has it at an instant: the stance it stands in, or
   * for a swinging foot the stance that claims the pelvis, the one it left at
   * its toe-off over the first half of the swing and the one it lands in at its
   * heel strike over the second.
   */
  export interface IScheduled extends IAutoMovieMotionHumanWalkFoot.IFoot {
    /** A swinging foot's share of its swing and the swing's two ends, seconds. */
    swing?: {
      /**
       * Progress through this foot's swing, from 0 at toe-off to 1 at heel
       * strike.
       */
      u: number;
      /** Toe-off instant in action-local seconds. */
      off: number;
      /** Heel-strike instant in action-local seconds. */
      on: number;
    };
  }

  /** A foot's placement and toes at an instant. */
  export interface IFoot {
    /** Its placement. */
    placement: IAutoMovieMotionHumanFoot.IPlacement;

    /** The toes' flexion from the foot, degrees, positive lifting them. */
    toes: number;
  }
}
