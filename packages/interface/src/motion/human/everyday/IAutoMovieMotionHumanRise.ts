import type { IAutoMovieMotionHumanBody } from "../body/IAutoMovieMotionHumanBody";
import type { IAutoMovieMotionManner } from "../compose/IAutoMovieMotionManner";
import type { IAutoMovieMotionHumanFoot } from "../posture/IAutoMovieMotionHumanFoot";

/**
 * Standing up from a seat, in the four phases of sit-to-stand (Schenkman,
 * Berger, Riley, Mann and Hodge 1990, Phys Ther 70:638): flexion momentum,
 * where the trunk flexes forward while the seat still bears the weight;
 * momentum transfer at seat-off, where the hips leave the seat and the body
 * moves forward over the feet; extension of the hips and knees; and
 * stabilisation.
 *
 * The goal is the seat socket's path from where it rests to where it stands
 * over the planted feet; the root follows from it and the trunk's pitch, and
 * the legs are solved onto the unmoved feet. The trunk flexes on a
 * minimum-jerk profile over the first half of the rise to a peak of at least
 * `35 + 50 (1 - r)` degrees, so it is still flexing fast when the seat is
 * left (peak trunk flexion closely follows seat-off, Schenkman et al.).
 * Seat-off comes at the first frame from 40 % of the rise (the flexion then
 * 94 % of its peak; provisional) to 45 %, at which the extrapolated centre
 * of mass of the engine's whole-body model (Hof, Gazendam and Sinke 2005)
 * enters the feet's base of support: the forward momentum of the flexing
 * trunk then carries the body over the feet. When no frame does, the peak
 * is raised in 5 degree steps up to 70 degrees, then the feet are drawn
 * further back (below), and a rise whose feet stand too far ahead even then
 * is refused. From seat-off the socket travels forward and up to standing
 * at 85 %, the trunk returns upright by the end, and the hands leave the
 * thighs, or the armrests they pushed on, over the next 30 %. The time is `2 (1 + 0.6 (1 - r))` seconds for a seat at `r` of the popliteal
 * height, the seat height being where the socket rests (provisional, as the
 * sit's).
 *
 * Before it, a body sitting deep edges forward on the seat until its hip
 * joints stand at most one thigh length behind the ankles, so the knees come
 * near over the feet, as people do before rising from a deep seat (a
 * provisional rule, kept 0.6 thigh lengths inside the front edge when the
 * entered sit names its seat); the edging takes `0.4 + 1.5 d` seconds for
 * `d` metres (provisional).
 *
 * Then each foot standing ahead of its knee is drawn back, one at a time
 * over `DRAW` seconds with a `LIFT` clearance, until the ankle stands behind
 * the knee with the shank 12 degrees forward of vertical, inside the 10 to
 * 15 degrees of a prepared sit-to-stand (moving the feet behind the knees
 * reduces the trunk lean the rise needs; Shepherd and Koh 1996, Scand J
 * Rehabil Med 28:79; values provisional). A body that cannot leave the seat
 * over feet drawn that far draws them further, 2 degrees of shank at a time,
 * up to the ankle's 20 degrees of dorsiflexion (the rig's range of motion).
 * A pelvis that stands more than 1 cm aside of the feet's middle, as after a
 * shift along the seat, has both feet set across by that distance in the
 * same draws, the foot on that side first: the body rises between its feet,
 * not over the edge of their base.
 *
 * The rise reads only the seated posture it is entered from, so it follows
 * a sit, a shift or any posture with the socket on a seat. Events `seatOff`
 * and `standing`; the seat window ends at seat-off.
 *
 * A seat above 1.2 of the popliteal height with a foot off the floor, as a
 * bar stool or a saddle is sat on, is got off instead
 * ({@link HumanMountOff}), ahead of the seat or to the side `to` names, with
 * the same events.
 *
 * @evidence contracts/development/common.md#meaningful-documentation to: Where the body gets off a high seat: ahead of it, or to one side of a seat sat astride. When absent, the left of a seat the entry's base names as sat astride (the side horses and cycles are mounted from, a provisional convention) and ahead of any other. Read only where the feet are off the floor; a seat inside the band is risen from over the planted feet. manner: How it is performed: the manner's tempo stretches or shortens the rise, or the getting off; neutral when absent. body: Borrowed body measurements and joint ranges used to compose the rising legs.
 * @evidence contracts/development/design.md#principled-representation to: Where the body gets off a high seat: ahead of it, or to one side of a seat sat astride. When absent, the left of a seat the entry's base names as sat astride (the side horses and cycles are mounted from, a provisional convention) and ahead of any other. Read only where the feet are off the floor; a seat inside the band is risen from over the planted feet. manner: How it is performed: the manner's tempo stretches or shortens the rise, or the getting off; neutral when absent. body: Borrowed body measurements and joint ranges used to compose the rising legs.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: chain/HumanChainPosture.ts (HumanChainPosture.rise, params); everyday/rise.ts (rise.plan, context); lexicon/HumanMountOff.ts (HumanMountOff.plan, context); compose/AutoMovieMotionHumanRise.ts (AutoMovieMotionHumanRise.lift, stance); touch/kiss.ts (kiss.solve, stance); touch/kiss.ts (kiss.posed, stance).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionManner, IAutoMovieMotionHumanFoot.IPlacement, IAutoMovieMotionHumanBody identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanRise {
  /**
   * Parameters; the rise starts from the seated entry.
   *
   * HumanPerformanceParams checks supplied parameters against the motions schema before planning; the action law owns reach and contact refusals.
   *
   * @evidence contracts/development/common.md#meaningful-documentation to: Where the body gets off a high seat: ahead of it, or to one side of a seat sat astride. When absent, the left of a seat the entry's base names as sat astride (the side horses and cycles are mounted from, a provisional convention) and ahead of any other. Read only where the feet are off the floor; a seat inside the band is risen from over the planted feet. manner: How it is performed: the manner's tempo stretches or shortens the rise, or the getting off; neutral when absent.
   * @evidence contracts/development/design.md#principled-representation to: Where the body gets off a high seat: ahead of it, or to one side of a seat sat astride. When absent, the left of a seat the entry's base names as sat astride (the side horses and cycles are mounted from, a provisional convention) and ahead of any other. Read only where the feet are off the floor; a seat inside the band is risen from over the planted feet. manner: How it is performed: the manner's tempo stretches or shortens the rise, or the getting off; neutral when absent.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: chain/HumanChainPosture.ts (HumanChainPosture.rise, params); everyday/rise.ts (rise.plan, context); lexicon/HumanMountOff.ts (HumanMountOff.plan, context); lexicon/HumanMountOff.ts (HumanMountOff.plan).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionManner identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IParams {
    /**
     * Where the body gets off a high seat: ahead of it, or to one side of a
     * seat sat astride. When absent, the left of a seat the entry's base
     * names as sat astride (the side horses and cycles are mounted from, a
     * provisional convention) and ahead of any other. Read only where the
     * feet are off the floor; a seat inside the band is risen from over the
     * planted feet.
     */
    to?: "front" | "left" | "right";

    /** How it is performed: the manner's tempo stretches or shortens the rise, or the getting off; neutral when absent. */
    manner?: IAutoMovieMotionManner;
  }

  /**
   * Both feet as they stand flat.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States that it holds one placement per foot, standing flat, in the placement frame of `HumanFoot`.
   * @evidence contracts/development/design.md#principled-representation A record keyed by the two sides, each a foot placement, the form `foot` and `lift` read.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned here for the rise and read by the stance solver and the kiss; it reuses `IAutoMovieMotionHumanFoot.IPlacement` instead of a second foot type.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A closed pair of keys, so neither a third foot nor a missing one can be written.
   */
  export type Stance = Record<
    "left" | "right",
    IAutoMovieMotionHumanFoot.IPlacement
  >;

  /**
   * The legs of a rise: each foot's goal on its raised placement, planted, with the toes bent back flat on the floor. Input props of AutoMovieMotionHumanRise.legs. The body, the flat stance, the window in seconds since the action's start and the heels' raise in degrees at a second.
   *
   * @evidence contracts/development/common.md#meaningful-documentation body: Borrowed body measurements and joint ranges used to compose the rising legs. from: Beginning of the leg primitive in action-relative seconds. to: End of the leg primitive in action-relative seconds.
   * @evidence contracts/development/design.md#principled-representation body: Borrowed body measurements and joint ranges used to compose the rising legs. from: Beginning of the leg primitive in action-relative seconds. to: End of the leg primitive in action-relative seconds.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: compose/AutoMovieMotionHumanRise.ts (AutoMovieMotionHumanRise.legs, props).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanBody, IAutoMovieMotionHumanRise.Stance identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export type ILegsProps = {
    /** Borrowed body measurements and joint ranges used to compose the rising legs. */
    body: IAutoMovieMotionHumanBody;
    /** Foot placement and support stance maintained during the rise. */
    stance: IAutoMovieMotionHumanRise.Stance;
    /** Beginning of the leg primitive in action-relative seconds. */
    from: number;
    /** End of the leg primitive in action-relative seconds. */
    to: number;
    /**
     * Retained synchronous callback returning HEEL-raise pitch in degrees for foot placement and toe flexion. Receives the action-relative second unchanged, without subtracting from or clamping. Each leg write calls it independently, so both legs can call it at the same second. The returned primitives retain props, stance and callback; captured inputs must stay stable and exceptions propagate.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanRise.ILegsProps.degrees: Retained synchronous callback returning HEEL-raise pitch in degrees for foot placement and toe flexion. Receives the action-relative second unchanged, without subtracting from or clamping. Each leg write calls it independently, so both legs can call it at the same second. The returned primitives retain props, stance and callback; captured inputs must stay stable and exceptions propagate.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanRise.ILegsProps.degrees is used through packages/motions/src/compose/AutoMovieMotionHumanRise.ts.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanRise.ILegsProps.degrees is used through packages/motions/src/compose/AutoMovieMotionHumanRise.ts.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanRise.ILegsProps.degrees is used through packages/motions/src/compose/AutoMovieMotionHumanRise.ts.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanRise.ILegsProps.degrees is used through packages/motions/src/compose/AutoMovieMotionHumanRise.ts.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanRise.ILegsProps.degrees is used through packages/motions/src/compose/AutoMovieMotionHumanRise.ts.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanRise.ILegsProps.degrees is used through packages/motions/src/compose/AutoMovieMotionHumanRise.ts.
     */
    degrees: (seconds: number) => number;
  };
}
