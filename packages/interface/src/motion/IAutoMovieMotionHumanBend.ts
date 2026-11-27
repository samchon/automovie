import type { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { AutoMovieHumanSide } from "../human/AutoMovieHumanSide";
import type { IAutoMovieMotionTarget } from "./IAutoMovieMotionTarget";
import type { IAutoMovieMotionHumanBody } from "./IAutoMovieMotionHumanBody";
import type { IAutoMovieMotionHumanBalance } from "./IAutoMovieMotionHumanBalance";
import type { IAutoMovieMotionHumanPosture } from "./IAutoMovieMotionHumanPosture";

/**
 * Bending down to bring a hand to a low point (the floor, a low shelf, a note
 * on the ground) with the feet planted, by a stoop, a squat or a semi-squat,
 * then straightening up.
 *
 * The goal is the palm on the target, facing it from above. The body is found
 * from that goal: the strategy sets how far the hips drop (a stoop keeps the
 * knees nearly straight, a squat lowers the hips to 0.45 of their height, a
 * semi-squat to 0.75; provisional shares, the postures the lifting literature
 * compares), and the trunk then inclines forward just enough to bring the
 * shoulder within the arm's reach of the target (`bendLower.REACH`, where
 * freely reaching people lean in, of the arm's length plus the palm's offset),
 * found by bisection, while the hips move back to keep the body balanced over
 * the feet ({@link HumanBalance}). The inclination is shared by the lumbopelvic
 * rhythm of forward bending: about 40 degrees of lumbar flexion against 70 of
 * hip flexion at full bending (Esola et al. 1996, Spine 21:71), so the pelvis
 * pitches 0.64 of it, the lumbar spine flexes 0.28 and the thorax 0.08
 * (`HumanTrunk.incline`). The legs are solved onto the planted feet, lowering
 * the pelvis where a leg could not reach (`resolveHumanPosture.lower`); a
 * squat, which outruns the ankles' 20 degree dorsiflexion range, lets the heels
 * rise up to 30 degrees, the feet rolling on their balls (provisional). The arm
 * goes onto the palm's goal and the gaze onto the target, and the free hand
 * braces on its own thigh just above the knee (Kingma, Faber and van Dieen
 * 2016, J Biomech 49:881, on supporting the trunk with a hand on the thigh
 * while lifting). No lifting technique is shown to be better than another (van
 * Dieen, Hoozemans and Toussaint 1999, Clin Biomech 14:685), so `auto` takes
 * the semi-squat for targets below mid-shank and the stoop above, the rule the
 * campaign sets, and squats where the semi-squat cannot reach (a short-armed
 * body cannot reach the floor from a semi-squat).
 *
 * The descent takes Fitts's time for the hand's travel, `a + b log2(2 D / W)`
 * with `a` 0.3 s, `b` 0.15 s and a 3 cm target width (Fitts 1954, J Exp Psychol
 * 47:381; constants provisional, scaled from 1.4 to 1.0 by the `speed` axis),
 * the hand holds for `hold` seconds and the rise takes the same time. Events:
 * `contact` and `deepest` at the bottom, `upright` at the end. A target the
 * strategy cannot reach is refused with the lowest height it reaches.
 */
export namespace IAutoMovieMotionHumanBend {
  /**
   * Parameters of a bend: the point the hand goes to, which hand, the strategy
   * and how long the hand stays there.
   */
  export interface IParams {
    /**
     * A balancing shift (`IAutoMovieMotionHumanBalance`): one closed-form shift
     * of its part, scaled by its weight between its two event-named instants,
     * each field absent taking the law's recommendation. Absent, none: the
     * posture is the law's own kinematic one with no balance shift or
     * centre-of-mass reading.
     */
    balance?: IAutoMovieMotionHumanBalance;

    /** The point the hand goes to. */
    target: IAutoMovieMotionTarget;

    /** The hand; `right` when absent. */
    hand?: AutoMovieHumanSide;

    /** How the body lowers; `auto` when absent. */
    strategy?: IAutoMovieMotionHumanBend.Strategy;

    /** Seconds the hand stays at the target, at least 0; 0.5 when absent. */
    hold?: number;
  }

  /**
   * A lowering strategy: `stoop` keeps the knees nearly straight, `squat`
   * lowers the hips to 0.45 of their height, `semiSquat` to 0.75, and `auto`
   * lets the plan choose by the target's height (`choose`).
   */
  export type Strategy = "stoop" | "semiSquat" | "squat" | "auto";

  /** An elbow hint in upper-arm lengths from the shoulder's rest place. */
  export interface IShares {
    /** Away from the midline. */
    out: number;

    /** Upward; negative is below the shoulder. */
    up: number;

    /** Forward; negative is behind the shoulder. */
    forward: number;
  }

  /** A named elbow hint; `ARM` states each one. */
  export type Arm = (readonly [
    "hang",
    "tucked",
    "behind",
    "front",
    "folded",
    "forward",
    "akimbo",
    "raised",
  ])[number];

  /** A request for the elbow place of a hand goal. */
  export interface ISolve {
    /** The body. */
    body: IAutoMovieMotionHumanBody;

    /**
     * The root and the heading that carry the trunk; a pitch and a roll left
     * out count as 0.
     */
    posture: Pick<IAutoMovieMotionHumanPosture, "root" | "yaw"> &
      Partial<Pick<IAutoMovieMotionHumanPosture, "pitch" | "roll">>;

    /** The arm. */
    side: AutoMovieHumanSide;

    /** The wrist's place, world metres. */
    point: IAutoMovieVector3;

    /**
     * The hand's world rotation from its rest; absent, the hand's turn adds no
     * strain.
     */
    rotation?: IAutoMovieQuaternion;

    /**
     * The preset or shares `solve` returns when no elbow place is allowed;
     * absent, it throws.
     */
    fallback?:
      | IAutoMovieMotionHumanBend.Arm
      | IAutoMovieMotionHumanBend.IShares;
  }
}
