/**
 * The values of the freedoms a law leaves a held thing's grasp or pose,
 * chosen by what the fitted body makes of them: the one shared chooser of a
 * held tool's pose (`StrikingRoll.chosen`) and of a kept grip on a handle
 * (`pushSled`).
 *
 * A law states a pose by values (a roll about a tool's line, a lean inside a
 * cone, a turn about a round handle, a place along its grip band) and judges
 * each by fitting the body to it and reading how far the fitted hand misses,
 * at one instant or at several, the worst of them counting. The values are
 * tried in the law's order of preference, nearest the asked pose first, and
 * the first held exactly is taken; when none is, the least missed is refined
 * by a pattern search (Hooke and Jeeves 1961) inside each freedom's bounds,
 * or round its period for a wrapped one.
 *
 * @evidence contracts/development/common.md#meaningful-documentation judge: How far the fitted hand misses the pose the values give, metres, at each instant the pose is judged at, read lazily and in order. miss: The worst of the misses at every instant, metres.
 * @evidence contracts/development/design.md#principled-representation judge: How far the fitted hand misses the pose the values give, metres, at each instant the pose is judged at, read lazily and in order. miss: The worst of the misses at every instant, metres.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: posture/HumanFreedomChoice.ts (HumanFreedomChoice.chosen, return); posture/HumanFreedomChoice.ts (HumanFreedomChoice.chosen, problem); handling/pushSled.ts (pushSled.plan.take); posture/HumanFreedomChoice.ts (HumanFreedomChoice.chosen.within).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Bounded intervals and periodic coordinates use separate cases; the chooser keeps failed candidates visible instead of inventing an admissible coordinate.
 */
export namespace IAutoMovieMotionHumanFreedomChoice {
  /**
   * One freedom of a pose: `bounded` between its least and greatest value,
   * or `wrapped`, a turn that repeats after its period (a round handle's turn
   * about its axis), with no bound. Its `step` is the refinement's first
   * step, in the freedom's own unit (degrees or metres); 0 holds the freedom
   * at its tried value.
   *
   * @evidence contracts/development/common.md#meaningful-documentation kind: Coordinate-domain discriminant: finite bounded interval or periodic wrapped coordinate. step: Search increment in the coordinate's own units. least: Inclusive lower coordinate bound in the coordinate's own units.
   * @evidence contracts/development/design.md#principled-representation kind: Coordinate-domain discriminant: finite bounded interval or periodic wrapped coordinate. step: Search increment in the coordinate's own units. least: Inclusive lower coordinate bound in the coordinate's own units.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: posture/HumanFreedomChoice.ts (HumanFreedomChoice.chosen.within).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted literal values are declared here directly; runtime handling remains in HumanFreedomChoice.chosen.within.
   */
  export type Freedom =
    | {
        /** Coordinate-domain discriminant: finite bounded interval or periodic wrapped coordinate. */
        kind: "bounded";
        /** Search increment in the coordinate's own units. */
        step: number;
        /** Inclusive lower coordinate bound in the coordinate's own units. */
        least: number;
        /** Inclusive upper coordinate bound in the coordinate's own units. */
        greatest: number;
      }
    | {
        /** Coordinate-domain discriminant: finite bounded interval or periodic wrapped coordinate. */
        kind: "wrapped";
        /** Search increment in the coordinate's own units. */
        step: number;
        /** Positive wrapping period in the coordinate's own units. */
        period: number;
      };

  /**
   * The freedoms of a pose as a law states them for `chosen`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation judge: How far the fitted hand misses the pose the values give, metres, at each instant the pose is judged at, read lazily and in order.
   * @evidence contracts/development/design.md#principled-representation judge: How far the fitted hand misses the pose the values give, metres, at each instant the pose is judged at, read lazily and in order.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: posture/HumanFreedomChoice.ts (HumanFreedomChoice.chosen, problem).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanFreedomChoice.Freedom identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IProblem {
    /** The values to judge first, in the law's order of preference, nearest the asked pose first. */
    tried: readonly (readonly number[])[];

    /** Each value's freedom, in the values' order. */
    freedoms: readonly IAutoMovieMotionHumanFreedomChoice.Freedom[];

    /**
     * How far the fitted hand misses the pose the values give, metres, at
     * each instant the pose is judged at, read lazily and in order.
     *
     * @param values The freedoms' values, inside their bounds.
     * @returns The misses, not negative.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the argument, the unit and the order of the result.
     * @evidence contracts/development/implementation.md#principled-implementation Each miss is a fit of the body the law poses, read back, so the joints' ranges count.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure One member, read by `chosen` for each candidate.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts `chosen` stops reading once a candidate cannot win, so an instant's fit is made only when it can still decide.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A declared member has no body; the cost belongs to each implementation.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A declared member coordinates no work.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A declared member owns no state.
     */
    judge(values: readonly number[]): Iterable<number>;
  }

  /**
   * The chosen values and the worst miss the judge read for them, metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation miss: The worst of the misses at every instant, metres.
   * @evidence contracts/development/design.md#principled-representation miss: The worst of the misses at every instant, metres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: posture/HumanFreedomChoice.ts (HumanFreedomChoice.chosen, return); handling/pushSled.ts (pushSled.plan.take).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted fields and units are declared here directly; runtime handling remains in HumanFreedomChoice.chosen.
   */
  export interface IChoice {
    /** The freedoms' values, inside their bounds. */
    values: number[];

    /** The worst of the misses at every instant, metres. */
    miss: number;
  }
}
