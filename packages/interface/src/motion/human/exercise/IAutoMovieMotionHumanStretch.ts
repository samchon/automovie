import type { IAutoMovieMotionManner } from "../compose/IAutoMovieMotionManner";

/**
 * A standing static stretch or yoga pose held and released (#3246, M24):
 * the neck side bend, the cross-body shoulder stretch, the overhead side
 * bend, the standing quadriceps stretch holding the ankle, and the tree
 * pose (ACSM's Guidelines, 11th ed.; the hold of 30 s, Bandy et al. 1997).
 *
 * Each pose is a phrase: `enter` to `reachEnd` over 1.5 s (provisional, a
 * stretch is entered slowly), the hold, and the release over 1.5 s. The
 * intensity names the share of the joint's own range a stretch uses
 * (`mild` half, `moderate` deep, `AutoMovieMotionHumanRange`), never more
 * than the range table allows.
 *
 * - Neck side bend: the neck and head bend to one side by the share of the
 *   neck's lateral range.
 * - Cross-body: the stretched arm crosses the chest until its wrist is
 *   beyond the other shoulder (provisional place), and the other palm
 *   presses the stretched arm near its elbow (`stretchCrossBody`).
 * - Overhead side bend: both arms overhead, palms facing, the spine and
 *   the chest bent to one side by the share of their lateral ranges, the
 *   pelvis level over the planted feet and the arms riding the chest.
 * - Quadriceps: the hips move over the standing foot, the other knee bends
 *   to at least 130 degrees (provisional) and as far as the same-side hand
 *   needs to hold the ankle (`stretchQuadriceps`).
 * - Tree: the hips over the standing foot, the other foot's sole on the
 *   inside of the standing calf, the knee turned out, the palms together
 *   before the chest.
 *
 * Events: `enter`, `reachEnd`, `release`, with the phrase instants.
 *
 * Not drafted: seated and floor stretches, PNF, dynamic stretches and the
 * flows (sun salutation); they need floor supports for the hands and seat.
 *
 * @evidence contracts/development/common.md#meaningful-documentation side: The side stretched or lifted; `right` when absent. seconds: Seconds held; `HOLD` when absent. Inclusive minimum: 0. Unit: "s". Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas. intensity: How far into the range; `moderate` when absent.
 * @evidence contracts/development/design.md#principled-representation side: The side stretched or lifted; `right` when absent. seconds: Seconds held; `HOLD` when absent. Inclusive minimum: 0. Unit: "s". Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas. intensity: How far into the range; `moderate` when absent.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: chain/HumanChainSport.ts (HumanChainSport.stretch, params); exercise/stretch.ts (stretch.plan, context); exercise/stretch.ts (stretch.plan); executable/cases/stretchCases.ts (stretchCases).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionManner.IManner identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanStretch {
  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and default.
   * @evidence contracts/development/design.md#principled-representation The pose, the side, the hold and the intensity.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The values the plan reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The intensity is a closed union.
   *
   * HumanPerformanceParams checks supplied parameters against the motions schema before planning; the action law owns reach and contact refusals.
   */
  export interface IParams {
    /** The pose. */
    kind: IAutoMovieMotionHumanStretch.Kind;

    /** The side stretched or lifted; `right` when absent. */
    side?: "left" | "right";

    /** Seconds held; `HOLD` when absent.
     * Inclusive minimum: 0. Unit: "s". Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
     */
    seconds?: number;

    /** How far into the range; `moderate` when absent. */
    intensity?: "mild" | "moderate";

    /** How it is performed. */
    manner?: IAutoMovieMotionManner.IManner;
  }

  /**
   * Capture cases of the standing stretches and yoga poses (#3246), each held 3 s on the right side at moderate intensity from quiet standing. The poses.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Capture cases of the standing stretches and yoga poses (#3246), each held 3 s on the right side at moderate intensity from quiet standing. The poses.
   * @evidence contracts/development/design.md#principled-representation Closed choices "neckSide", "crossBody", "overheadSide", "quadriceps", "tree" distinguish the admitted cases.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: executable/cases/stretchCases.ts (stretchCases).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted literal values are declared here directly; runtime handling remains in stretchCases.
   */
  export type Kind =
    | "neckSide"
    | "crossBody"
    | "overheadSide"
    | "quadriceps"
    | "tree";
}
