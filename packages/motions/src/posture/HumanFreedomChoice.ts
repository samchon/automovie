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
 * @evidence contracts/development/common.md#meaningful-documentation States what is chosen, how it is judged, the order, the stop and the refinement with its source.
 * @evidence contracts/development/design.md#principled-representation A freedom is a bounded interval or a wrapped period, each with its refinement step in its own unit; a judgement is the misses of one pose at its instants, so a pose kept through a motion counts its worst.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The tolerance, the refinement's shares and budget, the freedom, the problem, the choice and the chooser, read by `StrikingRoll` and `pushSled`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No tool, handle or instant is named; the law gives the values' meaning, the freedoms and the judge.
 */
export namespace HumanFreedomChoice {
  /** How near a fitted hand's miss must be to none for a pose to count as held exactly, metres, and the margin a later candidate must win by. */
  export const EXACT: number = 1e-4;

  /** The shares of each freedom's step a refinement takes in turn, halving: the last is an eighth of the first. */
  export const REFINE: readonly number[] = [1, 0.5, 0.25, 0.125];

  /** The most candidates a refinement judges, a search budget: each is one posture resolution per instant it is judged at. */
  export const FITS: number = 48;

  /**
   * One freedom of a pose: `bounded` between its least and greatest value,
   * or `wrapped`, a turn that repeats after its period (a round handle's turn
   * about its axis), with no bound. Its `step` is the refinement's first
   * step, in the freedom's own unit (degrees or metres); 0 holds the freedom
   * at its tried value.
   */
  export type Freedom =
    | { kind: "bounded"; step: number; least: number; greatest: number }
    | { kind: "wrapped"; step: number; period: number };

  /** The freedoms of a pose as a law states them for `chosen`. */
  export interface IProblem {
    /** The values to judge first, in the law's order of preference, nearest the asked pose first. */
    tried: readonly (readonly number[])[];

    /** Each value's freedom, in the values' order. */
    freedoms: readonly Freedom[];

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

  /** The chosen values and the worst miss the judge read for them, metres. */
  export interface IChoice {
    /** The freedoms' values, inside their bounds. */
    values: number[];

    /** The worst of the misses at every instant, metres. */
    miss: number;
  }

  /**
   * Choose a pose's values.
   *
   * @param problem The tried values, the freedoms and the judge.
   * @returns The chosen values and their worst miss.
   * @throws {Error} When no values are tried.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input, the result and the failure.
   * @evidence contracts/development/implementation.md#principled-implementation The tried values in order, the first under `EXACT` ending the search and a later one winning only by more than it; then the pattern search (Hooke and Jeeves 1961): each freedom is stepped either way by `REFINE` of its step, a step that lessens the miss is kept, and the steps halve when none does. A bounded value is clamped, a wrapped one taken into its period's half-open range about zero, so the search crosses a round handle's seam.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The tried values, then one pattern search, both judged by one lazy worst-of.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Nothing is moved outside the freedoms; a candidate's misses are read only until their worst reaches the best less `EXACT`, past which it cannot be taken, so the result is that of reading them all.
   * @evidence contracts/development/implementation.md#efficient-algorithms The tried values are judged lazily and stop at the first exact hold; a refinement judges at most `FITS` candidates, each read only as far as it can still win.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Called once per plan and pose.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function chosen(problem: IProblem): IChoice {
    const { tried, freedoms, judge } = problem;
    if (tried.length === 0) throw new Error("A pose has no candidate");
    const within = (values: readonly number[]): number[] =>
      values.map((v: number, i: number): number => {
        const freedom: Freedom = freedoms[i]!;
        if (freedom.kind === "bounded")
          return Math.min(freedom.greatest, Math.max(freedom.least, v));
        const p: number = freedom.period;
        const r: number = ((v % p) + p) % p;
        return r > p / 2 ? r - p : r;
      });

    // The worst miss of a candidate, read until it cannot beat `least`.
    const worst = (values: readonly number[], least: number): number => {
      let most: number = 0;
      for (const missed of judge(values)) {
        most = Math.max(most, missed);
        if (most >= least - EXACT) break;
      }
      return most;
    };

    let best: number[] = within(tried[0]!);
    let least: number = Infinity;
    for (const values of tried) {
      if (least <= EXACT) break;
      const v: number[] = within(values);
      const missed: number = worst(v, least);
      if (missed < least - EXACT) {
        least = missed;
        best = v;
      }
    }

    let fits: number = 0;
    for (const share of REFINE)
      for (let moved: boolean = true; moved; ) {
        moved = false;
        for (let d: number = 0; d < best.length && !moved; d++)
          for (const sign of [1, -1]) {
            const step: number = freedoms[d]!.step;
            if (least <= EXACT || fits >= FITS || step === 0) break;
            const v: number[] = within(
              best.map((x: number, i: number): number =>
                i === d ? x + sign * share * step : x,
              ),
            );
            if (v[d] === best[d]) continue;
            fits++;
            const missed: number = worst(v, least);
            if (missed < least - EXACT) {
              least = missed;
              best = v;
              moved = true;
              break;
            }
          }
      }
    return { values: best, miss: least };
  }
}
