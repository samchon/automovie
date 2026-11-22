import type { IAutoMovieMotionManner } from "../compose/IAutoMovieMotionManner";
import type { IAutoMovieMotionHumanBalance } from "../law/IAutoMovieMotionHumanBalance";

/**
 * A standing bodyweight exercise counted in repetitions (#3245, M24): the
 * squat, the forward lunge, high knees and the jumping jack (ACSM's
 * Guidelines for Exercise Testing and Prescription, 11th ed.).
 *
 * Every repetition has four spans: `eccentricStart` (lowering, or opening),
 * `bottom` (the pause at the bottom), `concentricStart` (rising, or closing)
 * and `top` (the pause on top), numbered from 1, so the counts are exact and
 * the tempo is the declared eccentric, pause and concentric seconds (2, 0, 1
 * when absent, the common 2-0-1 tempo; provisional).
 *
 * - Squat: the hips sink and the trunk pitches over the planted feet
 *   (`AutoMovieMotionHumanTrunk.crouch`), the hip shift solved for balance.
 *   The depth names the thigh's angle from the horizontal at the bottom:
 *   `quarter` 60, `half` 45, `parallel` 0 degrees; the hips' drop follows
 *   from the thigh and shank lengths with the shank leaning forward up to 35
 *   degrees (provisional, the ankle's working dorsiflexion), and the trunk
 *   pitches 15, 25 or 40 degrees (provisional).
 * - Lunge: the hips come down until the lead thigh is level over an upright
 *   shank and travel forward until the trailing thigh hangs under its hip,
 *   that leg's shank level behind it on a foot stood on its toes with the
 *   ankle at its dorsiflexion range; the lead foot steps out to stand a thigh
 *   ahead of the hips there, and steps back.
 * - High knees: one knee rises per repetition, alternating, the ankle under
 *   a thigh raised to the horizontal ahead of the hip, the hips carried over
 *   the standing foot.
 * - Jumping jack: the feet jump apart to 1.5 half shoulder widths each side
 *   of the midline (provisional) with the arms raised overhead, and back; a hop of
 *   4 cm (provisional) lifts the body in each jump, the feet free while
 *   they travel.
 *
 * Events: the numbered repetition instants. A cut at a repetition's `top`
 * into standing or another exercise is legal.
 *
 * Not drafted: floor exercises (push-up, plank, sit-up, glute bridge,
 * mountain climber, burpee), loaded lifts, machines and skipping rope; they
 * need hand and back supports on the floor.
 *
 * @evidence contracts/development/common.md#meaningful-documentation count: Whole-number repetitions, at least one; 3 when absent. Unit: dimensionless. Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas. depth: A squat's depth; `parallel` when absent. tempo: Eccentric, bottom pause and concentric seconds; `[2, 0, 1]` when absent.
 * @evidence contracts/development/design.md#principled-representation count: Whole-number repetitions, at least one; 3 when absent. Unit: dimensionless. Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas. depth: A squat's depth; `parallel` when absent. tempo: Eccentric, bottom pause and concentric seconds; `[2, 0, 1]` when absent.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: chain/HumanChainSport.ts (HumanChainSport.exercise, params); exercise/exercise.ts (exercise.plan, context); exercise/exercise.ts (exercise.drop, depth); exercise/exercise.ts (exercise.plan); executable/cases/exerciseCases.ts (exerciseCases); exercise/exercise.ts (exercise.THIGH).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionManner identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanExercise {
  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and default.
   * @evidence contracts/development/design.md#principled-representation The exercise, the count, the depth, the tempo and the lead side.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The values the plan reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The tempo is three seconds, as the issue's sketch writes it.
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

    /** The exercise. */
    kind: IAutoMovieMotionHumanExercise.Kind;

    /** Whole-number repetitions, at least one; 3 when absent. A repetition takes the `tempo` seconds plus 0.3 s at the top (`exercise`): 3.3 s at the default tempo, so 3 repetitions take 9.9 s. */
    count?: number;

    /** A squat's depth; `parallel` when absent. */
    depth?: IAutoMovieMotionHumanExercise.Depth;

    /** Eccentric, bottom pause and concentric seconds; `[2, 0, 1]` when absent: a controlled 2 s lowering and a 1 s rise. `manner.pace` scales the three; the 0.3 s at the top is fixed. */
    tempo?: readonly [number, number, number];

    /** The lunge's lead leg, or the first knee raised; `right` when absent. */
    side?: "left" | "right";

    /** How it is performed. */
    manner?: IAutoMovieMotionManner;
  }

  /**
   * Capture cases of the standing exercises (#3245), three repetitions each from quiet standing. The exercises.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Capture cases of the standing exercises (#3245), three repetitions each from quiet standing. The exercises.
   * @evidence contracts/development/design.md#principled-representation Closed choices "squat", "lunge", "highKnees", "jumpingJack" distinguish the admitted cases.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: executable/cases/exerciseCases.ts (exerciseCases).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted literal values are declared here directly; runtime handling remains in exerciseCases.
   */
  export type Kind = "squat" | "lunge" | "highKnees" | "jumpingJack";

  /**
   * The hips' drop of a squat to a depth. A squat's depth by name.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The hips' drop of a squat to a depth. A squat's depth by name.
   * @evidence contracts/development/design.md#principled-representation Closed choices "quarter", "half", "parallel" distinguish the admitted cases.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: exercise/exercise.ts (exercise.drop, depth); exercise/exercise.ts (exercise.THIGH); exercise/exercise.ts (exercise.PITCH); exercise/exercise.ts (exercise.plan).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted literal values are declared here directly; runtime handling remains in exercise.drop.
   */
  export type Depth = "quarter" | "half" | "parallel";
}
