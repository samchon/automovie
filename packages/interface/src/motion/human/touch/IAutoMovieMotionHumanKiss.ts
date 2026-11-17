import type { AutoMovieHumanoidRegion } from "../../../skeleton/AutoMovieHumanoidRegion";
import type { IAutoMovieMotionManner } from "../compose/IAutoMovieMotionManner";

/**
 * A kiss while standing: the lips brought to a partner's region (a cheek, the
 * forehead, the crown, the lips, the back of a hand) by leaning the body
 * from the hips and flexing the neck, the head turned to one side for a
 * cheek or the lips so the noses stay clear (#3284).
 *
 * The lean and the neck's flexion are solved at plan time so the mouth
 * region of the leaned posture lands on the target as it stands at the
 * kiss's start: a grid of pitch and flexion at 5 degree steps, then 1 degree
 * steps about the best, then a lean of up to 10 degrees to the side the
 * target lies on, and, when the mouth is still short, a rise onto the toes
 * of up to 35 degrees of heel (both provisional). The head turns 30 degrees
 * for a cheek or the lips (provisional), to the right unless `side` says
 * otherwise; Guntürkün 2003 observed a two-to-one rightward bias, which
 * Sedgewick et al. 2019 did not find, so the side is a parameter. The
 * approach is the free-space transport
 * of the mouth's travel, the kiss holds 0.6 s (provisional) and the return
 * takes the approach's time. Standing, the hips move back by the static
 * balance's shift at the solved lean (`HumanBalance.shift`, as a bow's do),
 * so the centre stays over the feet, and the lean is solved again with them
 * there. The feet stay where they stand; a difference
 * the lean, the neck and the toes cannot close is left as a miss the verdict
 * reports, and a step in is not drafted yet.
 *
 * Events: the phrase instants, with `contact` at `ready` and `part` at
 * `relax`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation side: Which way the head turns for a cheek or the lips; `right` when absent. hold: Seconds the lips stay; `HOLD` when absent. pitch: The lean forward from the hips, degrees.
 * @evidence contracts/development/design.md#principled-representation side: Which way the head turns for a cheek or the lips; `right` when absent. hold: Seconds the lips stay; `HOLD` when absent. pitch: The lean forward from the hips, degrees.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: actions/HumanMutual.ts (HumanMutual.kiss, params); chain/HumanChainMutual.ts (HumanChainMutual.kiss, params); touch/kiss.ts (kiss.plan, context); touch/kiss.ts (kiss.solve, return); touch/kiss.ts (kiss.solve.miss, s); touch/kiss.ts (kiss.solve.least, candidates).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical AutoMovieHumanoidRegion, IAutoMovieMotionManner identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanKiss {
  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and default.
   * @evidence contracts/development/design.md#principled-representation The partner and region as the target union's person case, the turn side as a closed union.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The values the plan reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the interface's regions.
   *
   * HumanPerformanceParams checks supplied parameters against the motions schema before planning; the action law owns reach and contact refusals.
   */
  export interface IParams {
    /** The partner. */
    partner: string;

    /** The partner's region. */
    region: AutoMovieHumanoidRegion;

    /** Which way the head turns for a cheek or the lips; `right` when absent. */
    side?: "left" | "right";

    /** Seconds the lips stay; `HOLD` when absent. */
    hold?: number;

    /** How it is performed. */
    manner?: IAutoMovieMotionManner;
  }

  /**
   * A solved kiss: how the body brings the mouth to the point.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and unit.
   * @evidence contracts/development/design.md#principled-representation The four angles the plan raises on its envelope and the distance they leave.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Five members, all read by the plan or the verdicts.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The miss is a member, so an unreachable target is reported and not hidden.
   */
  export interface ISolved {
    /** The lean forward from the hips, degrees. */
    pitch: number;

    /** The lean toward the body's right from the hips, degrees. */
    roll: number;

    /** The neck's and the head's flexion, degrees. */
    flexion: number;

    /** The heels' raise, degrees. */
    raise: number;

    /** The mouth's distance to the point, metres. */
    miss: number;
  }
}
