import type { IAutoMovieMotionManner } from "../compose/IAutoMovieMotionManner";

/**
 * The sprint start's crouch into the set position and its hold until the
 * gun (#3250): the hands on the start line, the front foot and the rear
 * foot on their blocks.
 *
 * The set position is solved from measured block settings and one measured
 * angle: the anthropometry-driven setting of Cavedon et al. (2019, PLoS One
 * 14:e0213979, table 2) puts the front block 0.60 of the leg's length behind
 * the line and the rear block 0.45 of it behind the front, and the front
 * knee stands at 90 degrees (their 90, SD 8; Harland and Steele 1997's
 * "about 90"). The hands lie on the line a shoulder width apart with the
 * four support frames fixed by the measured body. One whole-body fit
 * (`sprintStartSet`) keeps those supports, the front knee at 90, rear knee
 * within 117 +/- 11 and front hip within 43 +/- 6 degrees, and the sex-matched centre of mass
 * behind the line. Arm extension is free, rather than a fixed fraction
 * consuming a degree of freedom the measured posture needs. Hip height
 * and the trunk's inclination are results of that shared constrained fit.
 *
 * The crouch takes 1.5 s (provisional): the front foot steps back to its
 * block over the first half, the rear foot over the second, while the hips
 * travel and the trunk pitches down; the set is held, and the action ends
 * at the gun by default. With `drive`, the hands leave at the gun and the
 * rear foot leaves before the front foot. The final contact is `blockExit`.
 *
 * The knee-down marks posture, the first free sprint stride, hurdles and
 * relay exchanges are outside this block-start action.
 *
 * @evidence contracts/development/common.md#meaningful-documentation front: The front foot; with `on` and no `front`, the side of the placed front plate, otherwise `left`. on: Scene id of a starting block whose `front` and `rear` pedal affordances bear the feet; absent uses the body-scaled setting. sex: The sprinter's sex, the stratum whose measured centre-of-mass distance the set takes (`CENTRE`); `male` when absent. seconds: Seconds held in the set; 1.5 when absent. Inclusive minimum: 0. Unit: "s". Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
 * @evidence contracts/development/design.md#principled-representation front: The front foot; with `on` and no `front`, the side of the placed front plate, otherwise `left`. on: Scene id of a starting block whose `front` and `rear` pedal affordances bear the feet; absent uses the body-scaled setting. sex: The sprinter's sex, the stratum whose measured centre-of-mass distance the set takes (`CENTRE`); `male` when absent. seconds: Seconds held in the set; 1.5 when absent. Inclusive minimum: 0. Unit: "s". Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: chain/HumanChainSport.ts (HumanChainSport.athletics, params); sport/athletics.ts (athletics.plan, context); sport/athletics.ts (athletics.plan).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionManner identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanAthletics {
  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and default.
   * @evidence contracts/development/design.md#principled-representation The front foot and the time held.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The values the plan reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No block spacing in metres: the knees decide it.
   */
  export interface IParams {
    /** The front foot. The placed front plate chooses the side when `on` is set and this is absent. Otherwise defaults to `left`. */
    front?: "left" | "right";

    /** Scene id of the starting block. Its `front` and `rear` pedal affordances are the plates that bear the feet. Absent uses the body-scaled track setup. */
    on?: string;

    /** The sprinter's sex, the stratum whose measured centre-of-mass distance the set takes (`CENTRE`); `male` when absent. */
    sex?: "female" | "male";

    /** Seconds held in the set, at least 0; 1.5 when absent. */
    seconds?: number;

    /** The drive from the gun to the front block's exit, seconds, positive; the action ends at the gun when absent. */
    drive?: number;

    /** How it is performed. */
    manner?: IAutoMovieMotionManner;
  }
}
