import type { IAutoMovieMotionManner } from "../compose/IAutoMovieMotionManner";

/**
 * A crouch or a squat held in place: the hips sink over the planted feet to
 * a knee flexion the depth names, the trunk inclines until the centre of
 * mass is back over the feet, the hands come to rest on the thighs above the
 * knees, the body holds, then stands again.
 *
 * The depth is a knee flexion, not a height, so one depth fits every body:
 * `partial` is the parallel squat of about 100 degrees (Escamilla 2001, Med
 * Sci Sports Exerc 33:127) and `full` the deep squat at the knee's range end
 * of 150 degrees, inside the 141.6 degrees measured in kneeling (Acker et al.
 * 2011, J Arthroplasty 26:319) and below the 157 +- 6 degrees of a heels-up
 * squat (Hemmerich et al. 2006, J Orthop Res 24:770), which the range table
 * does not reach. The shank tilts forward by the crouching ankle's
 * dorsiflexion (`ANKLE`, within the range table's), plus the heel lift when
 * the heels are up (the foot pivots about its toes'
 * joint, which stays on the floor), and the thigh takes the rest of the knee
 * flexion, so the hip joint's place over the ankle follows from the leg's
 * two lengths. On the way down the shank and the thigh tilt together, each
 * by the descent's share of its own tilt, so the hips follow the leg's arc
 * and the ankle never passes its range: the heel stays down until the ankle
 * reaches the range and then rises by the rest, the heel-off of a
 * range-limited ankle. A depth whose thigh angle and the hip's flexion range leave
 * no room for the trunk is refused with the deepest knee flexion the heels
 * allow: a full squat with flat heels leaves the thigh past the hip's range
 * at the crouching ankle, so it asks for `heels: "up"`.
 *
 * The trunk's forward inclination is found by bisection at every eighth of
 * the descent, and by a secant search from those between them, so that the
 * whole-body centre of mass keeps a straight course over the soles, with no
 * speed to carry it off them: it stays where it stands with the heels flat,
 * or as near to that as the lumbar range brings it at the lowest pose, and
 * reaches the middle of the forefoot the body will stand on
 * (`HumanBalance.offset`, the base of support `HumanFoot.base`) by the time
 * the heels rise.
 * The inclination is shared by
 * the lumbopelvic rhythm: the pelvis tilts about the hips as far as the
 * folded thighs leave the hip room and the spine flexes for the rest, the
 * rounded back of a deep squat (`HumanTrunk.incline`); the hands rest
 * on the thighs just above the knees, as people support the trunk on the
 * thighs (Kingma, Faber and van Dieen 2016, J Biomech 49:881). The descent
 * takes 1.0 s for a partial and 1.3 s for a full squat at a 0.93 m hip
 * height, scaled by the square root of the hip height (dynamic similarity,
 * Alexander 1984) and by the manner's tempo (provisional), the hold `hold`
 * seconds and the rise as long as the descent. Events: `descend` at the
 * start, `lowest`, `ascend`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation depth: How deep; `partial` when absent. heels: The heels; `flat` for a partial and `up` for a full squat when absent. hold: Seconds held at the lowest pose; 1 when absent. Inclusive minimum: 0. Unit: "s". Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
 * @evidence contracts/development/design.md#principled-representation depth: How deep; `partial` when absent. heels: The heels; `flat` for a partial and `up` for a full squat when absent. hold: Seconds held at the lowest pose; 1 when absent. Inclusive minimum: 0. Unit: "s". Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: chain/HumanChainPosture.ts (HumanChainPosture.crouch, params); everyday/crouch.ts (crouch.plan, context); executable/cases/crouchCases.ts (crouchCases); everyday/crouch.ts (crouch.KNEE); everyday/crouch.ts (crouch.DESCENT); everyday/crouch.ts (crouch.plan).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionManner identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanCrouch {
  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and its default.
   * @evidence contracts/development/design.md#principled-representation Two closed names and a hold; the knee flexion and the heel lift come from tables.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Four optional members, all read by `plan`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No height or angle is typed by the author.
   *
   * HumanPerformanceParams checks supplied parameters against the motions schema before planning; the action law owns reach and contact refusals.
   */
  export interface IParams {
    /** How deep; `partial` when absent. */
    depth?: IAutoMovieMotionHumanCrouch.Depth;

    /** The heels; `flat` for a partial and `up` for a full squat when absent. */
    heels?: IAutoMovieMotionHumanCrouch.Heels;

    /** Seconds held at the lowest pose; 1 when absent.
     * Inclusive minimum: 0. Unit: "s". Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
     */
    hold?: number;

    /** How it is performed. */
    manner?: IAutoMovieMotionManner;
  }

  /**
   * How deep: a parallel squat or a deep squat.
   *
   * @evidence contracts/development/common.md#meaningful-documentation How deep: a parallel squat or a deep squat.
   * @evidence contracts/development/design.md#principled-representation Closed choices "partial", "full" distinguish the admitted cases.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: everyday/crouch.ts (crouch.KNEE); everyday/crouch.ts (crouch.DESCENT); everyday/crouch.ts (crouch.plan).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted literal values are declared here directly; runtime handling remains in crouch.KNEE.
   */
  export type Depth = "partial" | "full";

  /**
   * Whether the heels stay on the floor or rise about the toes' joints.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Whether the heels stay on the floor or rise about the toes' joints.
   * @evidence contracts/development/design.md#principled-representation Closed choices "flat", "up" distinguish the admitted cases.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: everyday/crouch.ts (crouch.plan).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted literal values are declared here directly; runtime handling remains in crouch.plan.
   */
  export type Heels = "flat" | "up";
}
