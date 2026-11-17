import type { IAutoMovieMotionManner } from "../compose/IAutoMovieMotionManner";

/**
 * Crawling on hands and knees along the heading, from standing: the body
 * gets down onto hands and knees, then crawls a number of cycles in the
 * diagonal pattern, each hand moving with the opposite knee like a
 * quadruped's trot (Patrick, Noah and Yang 2009, J Neurophysiol 101:603).
 *
 * The goals are floor points. The knees rest a shank's radius over the
 * floor under the hip joints with the thighs upright, the shins lying back
 * to feet tucked on their toes (`kneelKeys.tucked`); the palms rest flat
 * with each wrist under its shoulder and the arm at `ARM` of its length, so
 * the trunk's pitch is the one that puts the posed shoulders at that height.
 * The pelvis travels at a constant speed of one stride a cycle, as high as
 * each thigh reaches its knee from it; each limb is planted on a floor
 * point for `DUTY` of the cycle, centred on its own share, and swings to the
 * next one a stride ahead on an arc, a hand `LIFT` high and a knee
 * `KNEE_LIFT`, rising on the swing's time and travelling on its minimum-jerk
 * progress so it leaves the floor before it moves, the left hand and the
 * right knee half a cycle apart from the right hand and the left knee.
 * Each hip joint rides a thigh over its own
 * knee, so a swinging knee is lifted by the pelvis turning about the spine's
 * axis (the hip hike of a quadruped's swing), which the spine and the chest
 * turn back so the shoulders stay level over the hands. The crawl is placed
 * so each tucked foot's toes' joint is where the standing foot rolls onto
 * its toes, and the limbs land side by side, the first steps reaching each
 * limb's own footprint. Getting down from standing, the supports take the
 * body in turn (`crawlDown`): the feet roll onto their toes where they
 * stood, the body sits onto its knees in the kneel's time to lower and sit
 * back (`kneel.PHASES`), leans to its hands and comes forward over its
 * knees. Entered on the knees or
 * crouched (a crawl ends kneeling, a bear crawl crouched, and declares it),
 * it blends from the displayed entry over `DOWN` seconds instead, and any
 * other base is refused (`floorEntry`).
 * The cycle, the stride, the duty and the lift are provisional, scaled by
 * the square root of the hip height and the manner's tempo. Events: `down`
 * (on hands and knees), and per limb and cycle `<limb>Liftoff<n>` and
 * `<limb>Touchdown<n>`, the limb one of `leftHand`, `rightHand`, `leftKnee`,
 * `rightKnee`.
 *
 * The bear crawl is the same gait on the hands and the feet: the knees are
 * held `HOVER` off the floor, so the hips ride that much higher, and each
 * foot, on its ball behind its knee, is planted while its knee is. The
 * inchworm is its own walk (`crawlInchworm`).
 *
 * Not yet: the bear crawl's own timing (MacLellan et al. 2012 measured
 * hands-and-feet crawling; the knees' cycle is kept), the belly crawl,
 * turning, rising from the crawl, and knee contact windows (the contact
 * parts have no knee).
 *
 * @evidence contracts/development/common.md#meaningful-documentation kind: On what it crawls: `knees` (hands and knees), `bear` (hands and feet, the knees off the floor) or `inchworm` (the hands walked out to a plank, the feet in to the hands); `knees` when absent. cycles: How many crawl cycles; 3 when absent. Numeric representation: "uint32". Inclusive minimum: 1. Unit: dimensionless. Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
 * @evidence contracts/development/design.md#principled-representation kind: On what it crawls: `knees` (hands and knees), `bear` (hands and feet, the knees off the floor) or `inchworm` (the hands walked out to a plank, the feet in to the hands); `knees` when absent. cycles: How many crawl cycles; 3 when absent. Numeric representation: "uint32". Inclusive minimum: 1. Unit: dimensionless. Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: chain/HumanChainTravel.ts (HumanChainTravel.crawl, params); floor/crawl.ts (crawl.plan, context); floor/crawlInchworm.ts (crawlInchworm.plan, context); floor/crawl.ts (crawl.plan.centred, limb); floor/crawl.ts (crawl.plan.landed, limb); floor/crawl.ts (crawl.plan.print, limb).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionManner identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanCrawl {
  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its default.
   * @evidence contracts/development/design.md#principled-representation A kind, a cycle count and a manner.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Three members read by `plan`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No distance is typed.
   *
   * HumanPerformanceParams checks supplied parameters against the motions schema before planning; the action law owns reach and contact refusals.
   */
  export interface IParams {
    /** On what it crawls: `knees` (hands and knees), `bear` (hands and feet, the knees off the floor) or `inchworm` (the hands walked out to a plank, the feet in to the hands); `knees` when absent. */
    kind?: IAutoMovieMotionHumanCrawl.Kind;

    /** How many crawl cycles; 3 when absent.
     * Numeric representation: "uint32". Inclusive minimum: 1. Unit: dimensionless. Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
     */
    cycles?: number;

    /** How it is performed. */
    manner?: IAutoMovieMotionManner;
  }

  /**
   * On what the body crawls.
   *
   * @evidence contracts/development/common.md#meaningful-documentation On what the body crawls.
   * @evidence contracts/development/design.md#principled-representation Closed choices "knees", "bear", "inchworm" distinguish the admitted cases.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: floor/crawl.ts (crawl.KINDS).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted literal values are declared here directly; runtime handling remains in crawl.KINDS.
   */
  export type Kind = (readonly ["knees", "bear", "inchworm"])[number];

  /**
   * A limb of the crawl.
   *
   * @evidence contracts/development/common.md#meaningful-documentation A limb of the crawl.
   * @evidence contracts/development/design.md#principled-representation Closed choices "leftHand", "rightHand", "leftKnee", "rightKnee" distinguish the admitted cases.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: floor/crawl.ts (crawl.plan.centred, limb); floor/crawl.ts (crawl.plan.landed, limb); floor/crawl.ts (crawl.plan.print, limb); floor/crawl.ts (crawl.plan.kneeling, at); floor/crawl.ts (crawl.plan.down, limb); floor/crawl.ts (crawl.plan.lift, limb).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted literal values are declared here directly; runtime handling remains in crawl.plan.centred.
   */
  export type Limb = "leftHand" | "rightHand" | "leftKnee" | "rightKnee";
}
