import type { IAutoMovieMotionManner } from "../compose/IAutoMovieMotionManner";
import type { IAutoMovieMotionHumanSwimStroke } from "./IAutoMovieMotionHumanSwimStroke";

/**
 * Swimming on a declared water plane (#3254, M25): treading water and the
 * front crawl. There is no fluid: the root floats at the plane, a height the
 * author declares, and the limbs cycle by joint angles with their goals
 * released, as a swing arm does (`AutoMovieMotionHumanArm.swing`).
 *
 * - Treading water: upright with the mouth 5 cm above the plane
 *   (provisional), the hands sculling out and in at waist depth and the legs
 *   kicking alternately (a flutter standing in for the eggbeater, whose foot
 *   speed sets the height, Sanders 1999), one cycle a second (provisional).
 * - Front crawl: prone with the hips a chest's half depth under the plane, or
 *   as much higher as the breath needs, gliding ahead at 1 m/s (provisional).
 *   The body rolls 45 degrees (provisional) about its long axis toward each
 *   arm as it recovers, a whole-body rotation about the hips
 *   (`IAutoMovieMotionHumanPosture.rotation`, #3423) so the pelvis keeps the stroke's own
 *   joints. The shoulder turns one way round: its abduction
 *   runs from 180 degrees overhead to 0 at the hip and back, in front of the
 *   trunk for the pull (45 degrees of flexion at its middle, the elbow bent
 *   40) and behind it for the recovery (20 degrees of extension, the elbow
 *   bent 90 and the forearm turned 45 degrees toward the head, so the hand
 *   hangs under the elbow clear of the plane; all provisional). Each arm
 *   pulls from overhead to the
 *   hip over 60 % of the cycle and recovers over the water, elbow high, in
 *   the rest (provisional shares). The arms are apart by the propulsive share
 *   less the index of coordination, which runs from a novice's catch-up to an
 *   elite's near-opposition with the `sequencing` skill (Chollet et al. 2000
 *   as #3254 reads them; `PROPULSIVE`, `COORDINATION`). Six kicks per cycle (provisional) and a breath
 *   to the right once a cycle, the head turned 70 degrees (provisional) on
 *   the rolled trunk as the right arm recovers, which brings the mouth 2 cm
 *   (provisional) over the plane: there is no bow wave whose trough a real
 *   swimmer breathes in, so the body floats as high as its own mouth needs.
 *   One cycle lasts 1.4 s (provisional).
 *
 * Events: `entryRight{i}`, `entryLeft{i}` and `breath{i}` per cycle for the
 * crawl, `cycle{i}` for treading.
 *
 * The breaststroke, the backstroke and floating are keyed strokes
 * (`SwimStroke`), planned by their own table on the same plane.
 *
 * Not drafted: the eggbeater proper, entering and leaving the water.
 *
 * @evidence contracts/development/common.md#meaningful-documentation water: The water plane's world height, metres; the entry's chest height when absent. cycles: Cycles; 3 when absent. Numeric representation: "uint32". Inclusive minimum: 1. Unit: dimensionless. Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
 * @evidence contracts/development/design.md#principled-representation water: The water plane's world height, metres; the entry's chest height when absent. cycles: Cycles; 3 when absent. Numeric representation: "uint32". Inclusive minimum: 1. Unit: dimensionless. Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: chain/HumanChainSport.ts (HumanChainSport.swim, params); sport/swim.ts (swim.plan, context); sport/swim.ts (swim.plan); executable/cases/swimCases.ts (swimCases).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionManner, IAutoMovieMotionHumanSwimStroke.Name identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanSwim {
  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and default.
   * @evidence contracts/development/design.md#principled-representation The stroke, the plane's height and the cycle count.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The values the plan reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The plane is a world height the author states.
   *
   * HumanPerformanceParams checks supplied parameters against the motions schema before planning; the action law owns reach and contact refusals.
   */
  export interface IParams {
    /** The stroke. */
    kind: IAutoMovieMotionHumanSwim.Kind;

    /** The water plane's world height, metres; the entry's chest height when absent. */
    water?: number;

    /** Cycles; 3 when absent. A cycle takes 1.4 s in the front crawl (`swim.CYCLE`) and the backstroke, 1 s treading water, so 3 cycles of the crawl take 4.2 s; the keyed strokes take the seconds of their keys (`SwimStroke.strokes`).
     * Numeric representation: "uint32". Inclusive minimum: 1. Unit: dimensionless. Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
     */
    cycles?: number;

    /** How it is performed: `pace: 1.5` makes each cycle 1.5 times shorter and, for a keyed stroke, the glide 1.5 times faster ({@link IAutoMovieMotionManner.pace}). Neutral when absent. */
    manner?: IAutoMovieMotionManner;
  }

  /**
   * Capture cases of swimming (#3254) on a water plane at 1.2 m, drawn as a thin box, three cycles each. The strokes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Capture cases of swimming (#3254) on a water plane at 1.2 m, drawn as a thin box, three cycles each. The strokes.
   * @evidence contracts/development/design.md#principled-representation Closed choices "treadWater", "frontCrawl" distinguish the admitted cases.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: executable/cases/swimCases.ts (swimCases).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanSwimStroke.Name identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export type Kind =
    | "treadWater"
    | "frontCrawl"
    | IAutoMovieMotionHumanSwimStroke.Name;
}
