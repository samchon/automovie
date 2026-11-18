import type { IAutoMovieMotionManner } from "../compose/IAutoMovieMotionManner";
import type { IAutoMovieMotionHumanBalance } from "../law/IAutoMovieMotionHumanBalance";

/**
 * Kneeling from standing: on one knee (half kneel), on both knees upright,
 * or sitting back on the heels, held, then rising the way it went down.
 *
 * The goals are floor points, solved by {@link kneelKeys}. The kneeling leg
 * steps back onto its tucked toes while the hips run a course along the
 * heading that keeps the extrapolated centre of mass between the feet
 * ({@link AutoMovieMotionHumanCourse}; Hof, Gazendam and Sinke 2005): it goes
 * from where it stands to the middle between the two feet as the foot
 * travels, so the hips trail the foot and arrive after it lands. Through the
 * step the hips ride as high as the less extended leg reaches its foot, the
 * reach going from the standing leg's to `REACH` of its length, a reverse
 * lunge, and the pelvis tips forward by what keeps the leg behind inside the
 * hip's extension range (`kneelKeys.lean`). Then the hips lower until the knee touches the floor straight under
 * its hip joint with the thigh upright, the shin lying back along the floor
 * to the foot. For both knees the front leg then swings back and its knee
 * lands beside the first, and for sitting back the hips turn about the knees
 * toward the heels until the knees flex `kneelKeys.SIT` degrees. Pollard,
 * Porter and Redfern (2011, J Appl Biomech 27:233) give the four kneeling
 * postures. The hands rest on the thighs as the body settles.
 *
 * Each phase moves on minimum-jerk progress; its length is provisional,
 * scaled by the square root of the hip height (Alexander 1984) and by the
 * manner's tempo. The root is lowered wherever a planted leg could not reach
 * its foot. Events: `stepBack` at the start, `kneeContact`, `secondKnee` for
 * both knees, `seatOnHeels` for sitting back, `settled`, and when it rises
 * `kneeOff` and `stood`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation kind: The kneeling posture; `one` when absent. knee: The knee that goes down first; `right` when absent. hold: Seconds held kneeling, at least zero; 1.5 when absent. Unit: "s". Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
 * @evidence contracts/development/design.md#principled-representation kind: The kneeling posture; `one` when absent. knee: The knee that goes down first; `right` when absent. hold: Seconds held kneeling; 1.5 when absent. Unit: "s". Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: chain/HumanChainPosture.ts (HumanChainPosture.kneel, params); everyday/kneel.ts (kneel.plan, context); executable/cases/crouchCases.ts (crouchCases); everyday/kneel.ts (kneel.plan).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionManner identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanKneel {
  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and its default.
   * @evidence contracts/development/design.md#principled-representation A closed kind, a side, a hold and whether to rise.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Five optional members, all read by `plan`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No place or angle is typed by the author.
   *
   * HumanPerformanceParams checks supplied parameters against the motions schema before planning; the action law owns reach and contact refusals.
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

    /** The kneeling posture; `one` when absent. */
    kind?: IAutoMovieMotionHumanKneel.Kind;

    /** The knee that goes down first; `right` when absent. */
    knee?: "left" | "right";

    /** Seconds held kneeling; 1.5 when absent.
     * Unit: "s". Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
     */
    hold?: number;

    /** Whether the body rises again at the end; `true` when absent. */
    rise?: boolean;

    /** How it is performed. */
    manner?: IAutoMovieMotionManner;
  }

  /**
   * On one knee, on both knees upright, or sitting back on the heels.
   *
   * @evidence contracts/development/common.md#meaningful-documentation On one knee, on both knees upright, or sitting back on the heels.
   * @evidence contracts/development/design.md#principled-representation Closed choices "one", "both", "sitBack" distinguish the admitted cases.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: everyday/kneel.ts (kneel.plan).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted literal values are declared here directly; runtime handling remains in kneel.plan.
   */
  export type Kind = "one" | "both" | "sitBack";
}
