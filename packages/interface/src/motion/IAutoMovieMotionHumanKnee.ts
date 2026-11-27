import type { IAutoMovieMotionTarget } from "./IAutoMovieMotionTarget";

/**
 * A knee strike: the knee driven up and forward onto the target while the hands
 * hold the opponent's head or neck (the clinch) or stay at the guard.
 *
 * The knee is the weapon, and the thigh carries it on a circle about the hip
 * (`KneeReach`). The hips square to the thigh's heading, the support foot
 * pivoting on its ball with them; the pelvis travels along the line until the
 * knee's front is on the target, lowered as far as the planted support leg
 * needs to keep its foot, and the knee is solved from the hip that carriage
 * leaves it. A target outside the thigh's range or the pelvis's travel is the
 * declared miss at maximum reach (`short`), and one closer than the hips can
 * withdraw is `jammed`: the knee lands where it first meets the body.
 *
 * The knee is lifted, then the hips are driven in (`KneeForm.LIFT_SHARE`): the
 * thigh swings about the hip from where the stance had it to its solved
 * elevation on an early clock, the pelvis travels on a late one, and the way
 * back mirrors it. The shank folds under the knee and the toes point down along
 * it (`KneeForm.FLEXION`, `KneeForm.PLANTAR`), so the foot trails behind the
 * knee instead of leading it into the opponent's legs. The trunk leans back
 * slightly to keep the centre of mass over the pivoting support foot.
 *
 * The thigh, the shank and the foot are offered to the performance's joint
 * contact resolution as capsules on the shown leg (`StrikingWeapon`), so the
 * knee stops where any part of the leg first meets the other body; it holds for
 * the contact dwell, gives way before the body it rests on (`StrikingRide`),
 * and withdraws along the way it came, as the kick does.
 *
 * Timing (kickboxing research): the knee rises through the round kick's chamber
 * only, so it lands at the chamber key (preparation 0.074 s plus 14 % of the
 * 1.02 s execution) and recoils over the kick's 0.65 s; skill scales them like
 * the kick's. With a person target, the hands reach either side of the other's
 * nape for the clinch; GLORY allows one knee per clinch, which the kickboxing
 * rules check.
 */
export namespace IAutoMovieMotionHumanKnee {
  /** Parameters. */
  export interface IParams {
    /** What it strikes. */
    at: IAutoMovieMotionTarget;

    /**
     * Which leg: lead or rear; rear when absent. A knee is the kick's chamber
     * alone: contact 0.22 s after the start at elite skill (0.074 s plus the
     * 0.14 s chamber) and 0.65 s of recoil, the chamber and recoil 1.4 times at
     * novice ({@link IAutoMovieMotionHumanKick}).
     */
    leg?: IAutoMovieMotionHumanKnee.Leg;
  }

  /** The kneeing leg: the stance's lead leg or its rear leg. */
  export type Leg = "lead" | "rear";
}
