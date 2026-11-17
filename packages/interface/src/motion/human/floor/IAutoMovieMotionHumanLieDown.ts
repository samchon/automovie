import type { IAutoMovieMotionHumanJoints } from "../compose/IAutoMovieMotionHumanJoints";
import type { IAutoMovieMotionManner } from "../compose/IAutoMovieMotionManner";

/**
 * Lying down on the floor from standing into a position: supine, prone, or
 * on the left or right side. Entered on the knees or crouched over the
 * hands, as a crawl ends, the body goes from the posture it displays
 * through the route's postures after the kneel; any other base is refused (`floorEntry`).
 *
 * The movement passes through the floor postures people use to get down
 * (VanSant 1988, Phys Ther 68:185, codes the components of the reverse
 * rise): to lie on the back the body sits down onto the floor and rolls back;
 * to lie face down it kneels, goes onto hands and knees and lowers itself
 * forward; to lie on a side it lies on its back and rolls onto that side.
 * Each posture is a set of joint angles and a whole-body tilt (`POSES`,
 * provisional), passed through in joint space on minimum-jerk progress. At
 * every second the body rests on the floor: the root's height puts the
 * lowest point of the body's collision shapes on it (`knockdown.rest`), and
 * the pelvis stays over the place it stood on, so the body pivots about it.
 * Each phase takes `PHASE` seconds (provisional), scaled by the manner's
 * tempo; the position is then held `hold` seconds. Events: `getDown` at
 * the start, the arrival at each posture on the route (`seatContact`,
 * `kneeContact`, `handsDown`, `supine`, `prone`, `lateral`) and `settled`.
 *
 * Not yet: lying on a bed or a sofa (A2 support frames, A8 `surface`), the
 * recovery position, sleep with seeded position changes (Skarpsno et al.
 * 2017; De Koninck et al. 1992), rolling over and rising from a bed; the
 * feet are not planted while the body goes down, so they slide.
 *
 * @evidence contracts/development/common.md#meaningful-documentation position: The position; `supine` when absent. hold: Seconds held lying; 2 when absent. Inclusive minimum: 0. Schema default: 2. Unit: "s". Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas. pitch: Forward tilt, degrees.
 * @evidence contracts/development/design.md#principled-representation position: The position; `supine` when absent. hold: Seconds held lying; 2 when absent. Inclusive minimum: 0. Schema default: 2. Unit: "s". Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas. pitch: Forward tilt, degrees.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: chain/HumanChainPosture.ts (HumanChainPosture.lieDown, params); floor/lieDown.ts (lieDown.plan, context); floor/crawlInchworm.ts (crawlInchworm.plan.prefer, return); floor/crawlInchwormPose.ts (crawlInchwormPose.of, return); floor/getUp.ts (getUp.quiet, return); floor/getUp.ts (getUp.keyed, return).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionManner.IManner, IAutoMovieMotionHumanJoints.Angles identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanLieDown {
  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its default.
   * @evidence contracts/development/design.md#principled-representation A closed position and a hold.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Three members read by `plan`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No angle is typed by the author.
   *
   * HumanPerformanceParams checks supplied parameters against the motions schema before planning; the action law owns reach and contact refusals.
   */
  export interface IParams {
    /** The position; `supine` when absent. */
    position?: IAutoMovieMotionHumanLieDown.Position;

    /** Seconds held lying; 2 when absent.
     * Inclusive minimum: 0. Schema default: 2. Unit: "s". Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
     */
    hold?: number;

    /** How it is performed. */
    manner?: IAutoMovieMotionManner.IManner;
  }

  /**
   * A lying position.
   *
   * @evidence contracts/development/common.md#meaningful-documentation A lying position.
   * @evidence contracts/development/design.md#principled-representation Closed choices "supine", "prone", "lateralLeft", "lateralRight", "sitLong", "sitCrossed", "sitSide" distinguish the admitted cases.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: floor/lieDown.ts (lieDown.POSES); floor/lieDown.ts (lieDown.FOLDED); floor/lieDown.ts (lieDown.ROUTES); floor/lieDown.ts (lieDown.plan).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted literal values are declared here directly; runtime handling remains in lieDown.POSES.
   */
  export type Position =
    | "supine"
    | "prone"
    | "lateralLeft"
    | "lateralRight"
    | "sitLong"
    | "sitCrossed"
    | "sitSide";

  /**
   * A floor posture: the whole body's tilt and its joints.
   *
   * @evidence contracts/development/common.md#meaningful-documentation pitch: Forward tilt, degrees. roll: Tilt toward the right, degrees. joints: Clinical joint angles, degrees.
   * @evidence contracts/development/design.md#principled-representation pitch: Forward tilt, degrees. roll: Tilt toward the right, degrees. joints: Clinical joint angles, degrees.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: floor/crawlInchworm.ts (crawlInchworm.plan.prefer, return); floor/crawlInchwormPose.ts (crawlInchwormPose.of, return); floor/getUp.ts (getUp.quiet, return); floor/getUp.ts (getUp.keyed, return); floor/getUp.ts (getUp.mirrored, pose); floor/getUp.ts (getUp.mirrored, return).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanJoints.Angles identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IPose {
    /** Forward tilt, degrees. */
    pitch: number;

    /** Tilt toward the right, degrees. */
    roll: number;

    /** Clinical joint angles, degrees. */
    joints: IAutoMovieMotionHumanJoints.Angles;
  }
}
