import type { IAutoMovieMotionManner } from "../compose/IAutoMovieMotionManner";

/**
 * A standing static stretch or yoga pose held and released: the neck side bend,
 * the cross-body shoulder stretch, the overhead side bend, the standing
 * quadriceps stretch holding the ankle, and the tree pose (ACSM's Guidelines,
 * 11th ed.; the hold of 30 s, Bandy et al. 1997).
 *
 * Each pose is a phrase: `enter` to `reachEnd` over 1.5 s (provisional, a
 * stretch is entered slowly), the hold, and the release over 1.5 s. The
 * intensity names the share of the joint's own range a stretch uses (`mild`
 * half, `moderate` deep, `AutoMovieMotionHumanRange`), never more than the
 * range table allows.
 *
 * - Neck side bend: the neck and head bend to one side by the share of the neck's
 *   lateral range.
 * - Cross-body: the stretched arm crosses the chest until its wrist is beyond the
 *   other shoulder (provisional place), and the other palm presses the
 *   stretched arm near its elbow (`stretchCrossBody`).
 * - Overhead side bend: both arms overhead, palms facing, the spine and the chest
 *   bent to one side by the share of their lateral ranges, the pelvis level
 *   over the planted feet and the arms riding the chest.
 * - Quadriceps: the hips move over the standing foot, the other knee bends to at
 *   least 130 degrees (provisional) and as far as the same-side hand needs to
 *   hold the ankle (`stretchQuadriceps`).
 * - Tree: the hips over the standing foot, the other foot's sole on the inside of
 *   the standing calf, the knee turned out, the palms together before the
 *   chest.
 *
 * Events: `enter`, `reachEnd`, `release`, with the phrase instants.
 *
 * Not drafted: seated and floor stretches, PNF, dynamic stretches and the flows
 * (sun salutation); they need floor supports for the hands and seat.
 */
export namespace IAutoMovieMotionHumanStretch {
  /** Parameters. */
  export interface IParams {
    /** The pose. */
    kind: IAutoMovieMotionHumanStretch.Kind;

    /** The side stretched or lifted; `right` when absent. */
    side?: "left" | "right";

    /**
     * Seconds held at the end of the range, at least 0, after 1.5 s to enter
     * and before 1.5 s to release; `HOLD` when absent (`stretch.HOLD`, 30 s,
     * Bandy et al. 1997).
     */
    hold?: number;

    /**
     * How far into the joint's own range (`stretch.INTENSITY`): `mild` half of
     * it, a gentle stretch; `moderate` deep, a working stretch or a held pose.
     * `moderate` when absent.
     */
    depth?: "mild" | "moderate";

    /** How it is performed. */
    manner?: IAutoMovieMotionManner;
  }

  /**
   * Capture cases of the standing stretches and yoga poses, each held 3 s on
   * the right side at moderate intensity from quiet standing. The poses.
   */
  export type Kind =
    | "neckSide"
    | "crossBody"
    | "overheadSide"
    | "quadriceps"
    | "tree";
}
