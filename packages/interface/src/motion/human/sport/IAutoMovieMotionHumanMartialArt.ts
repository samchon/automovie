import type { IAutoMovieMotionManner } from "../compose/IAutoMovieMotionManner";

/**
 * Martial-art forms other than kickboxing (#3252): the karate horse stance
 * (kiba-dachi), alternating straight punches from it (choku-zuki) and the
 * tai chi push in a bow stance.
 *
 * - Horse stance: the left foot steps out until the feet stand two
 *   shoulder widths apart (provisional) and the hips sink a fifth of the
 *   thigh (provisional), held, and the foot steps back.
 * - Choku-zuki: from the horse stance, each fist drives from its chamber at
 *   the hip (waist height, at the shoulder's side) to the midline at chest
 *   height an arm's reach ahead, the other fist pulled back to its chamber
 *   at the same time (hikite). Each punch extends in 0.2 s and stays 0.2 s,
 *   inside the 400 ms a choku-zuki takes (VencesBrito et al. 2011); the
 *   hands alternate.
 * - Tai chi push: the lead foot steps ahead 0.35 statures (provisional)
 *   over 3 s as the hips come half the step forward and sink until both
 *   legs reach their feet; over 3 s more the weight shifts to six tenths of
 *   the step as the palms push from before the chest to an arm's reach
 *   ahead, then shifts back over 3 s, and the foot returns over 3 s: the
 *   slow, continuous form of tai chi (Wu and Hitt 2005).
 *
 * Forms are authored as ordered technique lists; no named form's content is
 * shipped. Not drafted: front and back stances as their own rows, blocks,
 * taekwondo's back and turning kicks, judo and wrestling (the grappling
 * owner's) and the tai chi gait.
 *
 * @evidence contracts/development/common.md#meaningful-documentation count: Punches of a choku-zuki series; 4 when absent. Numeric representation: "uint32". Inclusive minimum: 1. Unit: dimensionless. Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas. seconds: Seconds the stance is held; 1 when absent. Inclusive minimum: 0. Unit: "s". Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
 * @evidence contracts/development/design.md#principled-representation count: Punches of a choku-zuki series; 4 when absent. Numeric representation: "uint32". Inclusive minimum: 1. Unit: dimensionless. Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas. seconds: Seconds the stance is held; 1 when absent. Inclusive minimum: 0. Unit: "s". Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: chain/HumanChainSport.ts (HumanChainSport.martialArt, params); sport/martialArt.ts (martialArt.plan, context); sport/martialArt.ts (martialArt.plan); executable/cases/martialArtCases.ts (martialArtCases).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionManner.IManner identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanMartialArt {
  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and default.
   * @evidence contracts/development/design.md#principled-representation The technique, the punch count and the hold.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The values the plan reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   *
   * HumanPerformanceParams checks supplied parameters against the motions schema before planning; the action law owns reach and contact refusals.
   */
  export interface IParams {
    /** The technique. */
    kind: IAutoMovieMotionHumanMartialArt.Kind;

    /** Punches of a choku-zuki series; 4 when absent.
     * Numeric representation: "uint32". Inclusive minimum: 1. Unit: dimensionless. Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
     */
    count?: number;

    /** Seconds the stance is held; 1 when absent.
     * Inclusive minimum: 0. Unit: "s". Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
     */
    seconds?: number;

    /** How it is performed. */
    manner?: IAutoMovieMotionManner.IManner;
  }

  /**
   * Capture cases of the martial-art techniques (#3252) from quiet standing. The techniques.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Capture cases of the martial-art techniques (#3252) from quiet standing. The techniques.
   * @evidence contracts/development/design.md#principled-representation Closed choices "horseStance", "chokuZuki", "taiChiPush" distinguish the admitted cases.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: executable/cases/martialArtCases.ts (martialArtCases).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted literal values are declared here directly; runtime handling remains in martialArtCases.
   */
  export type Kind = "horseStance" | "chokuZuki" | "taiChiPush";
}
