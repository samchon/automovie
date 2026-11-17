import type { IAutoMovieMotionHumanFreedomChoice } from "@automovie/interface";

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
   * The turns a hand tries about an axis, in its own order: none, then each
   * multiple of a step up to the half turn, the turn toward the hand's own
   * sense before its opposite. A turn about an axis mirrors to the opposite
   * turn about the mirrored axis, so the left hand's sense is the right's
   * negated: listed in one order for both, the left hand tried the mirror
   * of `-step` where the right tries `step`, and of two turns that hold
   * alike the two hands kept turns that are not each other's mirror.
   *
   * @param step The spacing of the turns, degrees, positive.
   * @param side The hand.
   * @returns The turns, degrees, in `(-180, 180]`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the order, why it depends on the hand, the unit and the range.
   * @evidence contracts/development/implementation.md#principled-implementation The mirror image of a rotation is the opposite rotation about the mirrored axis, so a mirrored list is the negated one.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The half turn is its own mirror and is listed once.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work per turn.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work One owner of the order for the grasp, wear and dress choosers.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh list and retains nothing.
   */
  export function turns(step: number, side: "left" | "right"): number[] {
    const sense: number = side === "left" ? -1 : 1;
    const out: number[] = [0];
    for (let k: number = step; k <= 180; k += step)
      out.push(...(k < 180 ? [sense * k, -sense * k] : [k]));
    return out;
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
  export function chosen(problem: IAutoMovieMotionHumanFreedomChoice.IProblem): IAutoMovieMotionHumanFreedomChoice.IChoice {
    const { tried, freedoms, judge } = problem;
    if (tried.length === 0) throw new Error("A pose has no candidate");
    const within = (values: readonly number[]): number[] =>
      values.map((v: number, i: number): number => {
        const freedom: IAutoMovieMotionHumanFreedomChoice.Freedom = freedoms[i]!;
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
