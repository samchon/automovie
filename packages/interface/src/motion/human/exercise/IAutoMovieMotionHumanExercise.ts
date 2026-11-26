import type { IAutoMovieMotionManner } from "../compose/IAutoMovieMotionManner";
import type { IAutoMovieMotionHumanBalance } from "../law/IAutoMovieMotionHumanBalance";

/**
 * A standing bodyweight exercise counted in repetitions: the squat, the forward
 * lunge, high knees and the jumping jack (ACSM's Guidelines for Exercise
 * Testing and Prescription, 11th ed.).
 *
 * Every repetition has four spans: `eccentricStart` (lowering, or opening),
 * `bottom` (the pause at the bottom), `concentricStart` (rising, or closing)
 * and `top` (the pause on top), numbered from 1, so the counts are exact and
 * the tempo is the declared eccentric, pause and concentric seconds (2, 0, 1
 * when absent, the common 2-0-1 tempo; provisional).
 *
 * - Squat lowers and moves the hips back over planted feet. The quarter, half and
 *   parallel depths place the thighs 60, 45 and 0 degrees above horizontal. The
 *   shanks lean forward up to 35 degrees and the trunk pitches 15, 25 or 40
 *   degrees. An optional balance correction acts on this path.
 * - Lunge: the hips come down until the lead thigh is level over an upright shank
 *   and travel forward until the trailing thigh hangs under its hip, that leg's
 *   shank level behind it on a foot stood on its toes with the ankle at its
 *   dorsiflexion range; the lead foot steps out to stand a thigh ahead of the
 *   hips there, and steps back.
 * - High knees: one knee rises per repetition, alternating, the ankle under a
 *   thigh raised to the horizontal ahead of the hip, the hips carried over the
 *   standing foot.
 * - Jumping jack: the feet jump apart to 1.5 half shoulder widths each side of
 *   the midline (provisional) with the arms raised overhead, and back; a hop of
 *   4 cm (provisional) lifts the body in each jump, the feet free while they
 *   travel.
 *
 * Events: the numbered repetition instants. A cut at a repetition's `top` into
 * standing or another exercise is legal.
 *
 * Not drafted: floor exercises (push-up, plank, sit-up, glute bridge, mountain
 * climber, burpee), loaded lifts, machines and skipping rope; they need hand
 * and back supports on the floor.
 */
export namespace IAutoMovieMotionHumanExercise {
  /** Parameters. */
  export interface IParams {
    /**
     * A balancing shift (`IAutoMovieMotionHumanBalance`): one closed-form shift
     * of its part, scaled by its weight between its two event-named instants,
     * each field absent taking the law's recommendation. Absent, none: the
     * posture is the law's own kinematic one with no balance shift or
     * centre-of-mass reading.
     */
    balance?: IAutoMovieMotionHumanBalance;

    /** The exercise. */
    kind: IAutoMovieMotionHumanExercise.Kind;

    /**
     * Whole-number repetitions, at least one; 3 when absent. A repetition takes
     * the `tempo` seconds plus 0.3 s at the top (`exercise`): 3.3 s at the
     * default tempo, so 3 repetitions take 9.9 s.
     */
    count?: number;

    /** A squat's depth; `parallel` when absent. */
    depth?: IAutoMovieMotionHumanExercise.Depth;

    /**
     * Eccentric, bottom pause and concentric seconds; `[2, 0, 1]` when absent:
     * a controlled 2 s lowering and a 1 s rise. `manner.pace` scales the three;
     * the 0.3 s at the top is fixed.
     */
    tempo?: readonly [number, number, number];

    /** The lunge's lead leg, or the first knee raised; `right` when absent. */
    side?: "left" | "right";

    /** How it is performed. */
    manner?: IAutoMovieMotionManner;
  }

  /**
   * Capture cases of the standing exercises, three repetitions each from quiet
   * standing. The exercises.
   */
  export type Kind = "squat" | "lunge" | "highKnees" | "jumpingJack";

  /** The hips' drop of a squat to a depth. A squat's depth by name. */
  export type Depth = "quarter" | "half" | "parallel";
}
