import type { IAutoMovieMotionManner } from "../compose/IAutoMovieMotionManner";
import type { IAutoMovieMotionHumanSwimStroke } from "../sport/IAutoMovieMotionHumanSwimStroke";

/**
 * Moving and floating in water: the strokes, the immersed float and glide, and
 * the aquatic actions. The crawl cycle is 1.4 s at a 1 m/s glide (provisional);
 * the breaststroke glides at 0.9 m/s, the backstroke at 1 m/s and floating at 0
 * (`SwimStroke.strokes`); skill does not change the glide.
 *
 * A method here is a method of `HumanChain` when its name is in
 * `AutoMovieMotionHumanActionName`. Any other member is a registered law or
 * row: pass it in `laws: [...]` to the performance, taking it from
 * `AutoMovieMotionHumanSwim` or from the row namespace of the family, and
 * append it with `chain.registered("<name>", params)`. A member that is a
 * function, a reader or a layer says so in its own comment.
 *
 * @template Chain The chain every method returns; the chain implements this
 *   interface.
 */


/**
 * Swimming on a declared water plane: treading water and the front crawl. There
 * is no fluid: the root floats at the plane, a height the author declares, and
 * the limbs cycle by joint angles with their goals released, as a swing arm
 * does (`AutoMovieMotionHumanArm.swing`).
 *
 * - Treading water: upright with the mouth 5 cm above the plane (provisional),
 *   the hands sculling out and in at waist depth and the legs kicking
 *   alternately (a flutter standing in for the eggbeater, whose foot speed sets
 *   the height, Sanders 1999), one cycle a second (provisional).
 * - Front crawl: prone with the hips a chest's half depth under the plane, or as
 *   much higher as the breath needs, gliding ahead at 1 m/s (provisional). The
 *   body rolls 45 degrees (provisional) about its long axis toward each arm as
 *   it recovers, a whole-body rotation about the hips
 *   (`IAutoMovieMotionHumanPosture.rotation`) so the pelvis keeps the stroke's
 *   own joints. The shoulder turns one way round: its abduction runs from 180
 *   degrees overhead to 0 at the hip and back, in front of the trunk for the
 *   pull (45 degrees of flexion at its middle, the elbow bent 40) and behind it
 *   for the recovery (20 degrees of extension, the elbow bent 90 and the
 *   forearm turned 45 degrees toward the head, so the hand hangs under the
 *   elbow clear of the plane; all provisional). Each arm pulls from overhead to
 *   the hip over 60 % of the cycle and recovers over the water, elbow high, in
 *   the rest (provisional shares). The arms are apart by the propulsive share
 *   less the index of coordination, which runs from a novice's catch-up to an
 *   elite's near-opposition with the `sequencing` skill (Chollet et al. 2000 as
 *   the research reads them; `PROPULSIVE`, `COORDINATION`). Six kicks per cycle
 *   (provisional) and a breath to the right once a cycle, the head turned 70
 *   degrees (provisional) on the rolled trunk as the right arm recovers, which
 *   brings the mouth 2 cm (provisional) over the plane: there is no bow wave
 *   whose trough a real swimmer breathes in, so the body floats as high as its
 *   own mouth needs. One cycle lasts 1.4 s (provisional).
 *
 * Events: `entryRight{i}`, `entryLeft{i}` and `breath{i}` per cycle for the
 * crawl, `cycle{i}` for treading.
 *
 * The breaststroke, the backstroke and floating are keyed strokes
 * (`SwimStroke`), planned by their own table on the same plane.
 *
 * Not drafted: the eggbeater proper, entering and leaving the water.
 */
export namespace IAutoMovieMotionHumanSwim {
  /** Parameters. */
  export interface IParams {
    /** The stroke. */
    kind: IAutoMovieMotionHumanSwim.Kind;

    /**
     * The water plane's world height, metres; the entry's chest height when
     * absent.
     */
    water?: number;

    /**
     * Cycles, a whole number of at least 1; 3 when absent. A cycle takes 1.4 s
     * in the front crawl (`swim.CYCLE`) and the backstroke, 1 s treading water,
     * so 3 cycles of the crawl take 4.2 s; the keyed strokes take the seconds
     * of their keys (`SwimStroke.strokes`).
     */
    count?: number;

    /**
     * How it is performed: `pace: 1.5` makes each cycle 1.5 times shorter and,
     * for a keyed stroke, the glide 1.5 times faster
     * ({@link IAutoMovieMotionManner.pace}). Neutral when absent.
     */
    manner?: IAutoMovieMotionManner;
  }

  /**
   * Capture cases of swimming on a water plane at 1.2 m, drawn as a thin box,
   * three cycles each. The strokes.
   */
  export type Kind =
    | "treadWater"
    | "frontCrawl"
    | IAutoMovieMotionHumanSwimStroke.Name;
}
