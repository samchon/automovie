import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanFreedomChoice,
} from "@automovie/interface";

/*
 * The values of the freedoms a law leaves a held thing's grasp or pose, chosen
 * by what the fitted body makes of them: the one shared chooser of a held
 * tool's pose (`StrikingRoll.chosen`) and of a kept grip on a handle
 * (`pushSled`).
 *
 * A law states a pose by values (a roll about a tool's line, a lean inside a
 * cone, a turn about a round handle, a place along its grip band) and judges
 * each by fitting the body to it and reading how far the fitted hand misses, at
 * one instant or at several, the worst of them counting. The values are tried
 * in the law's order of preference, nearest the asked pose first, and the first
 * held exactly is taken; when none is, the least missed is refined by a pattern
 * search (Hooke and Jeeves 1961) inside each freedom's bounds, or round its
 * period for a wrapped one, and while still none holds exactly the search
 * starts again from each other tried value, least missed first, that no
 * finished search ended within half a step of (a multistart local search, Marti
 * 2003), the budget shared by every start.
 */
export namespace HumanFreedomChoice {
  /*
   * How near a fitted hand's miss must be to none for a pose to count as held
   * exactly, metres, and the margin a later candidate must win by.
   */
  export const EXACT: number = 1e-4;

  /*
   * The shares of each freedom's step a refinement takes in turn, halving: the
   * last is an eighth of the first.
   */
  export const REFINE: readonly number[] = [1, 0.5, 0.25, 0.125];

  /*
   * The most candidates the refinements of one choice judge together, a search
   * budget: each is one posture resolution per instant it is judged at.
   */
  export const FITS: number = 48;

  /*
   * The turns a hand tries about an axis, in its own order: none, then each
   * multiple of a step up to the half turn, the turn toward the hand's own
   * sense before its opposite. A turn about an axis mirrors to the opposite
   * turn about the mirrored axis, so the left hand's sense is the right's
   * negated: listed in one order for both, the left hand tried the mirror of
   * `-step` where the right tries `step`, and of two turns that hold alike the
   * two hands kept turns that are not each other's mirror.
   * Parameter step: The spacing of the turns, degrees, positive and finite.
   * Parameter side: The hand.
   * Returns: The turns, degrees, in `(-180, 180]`.
   * For a step that is not positive, or so fine that the
   * multiples up to the half turn are not a safe integer count.
   */
  export function turns(step: number, side: AutoMovieHumanSide): number[] {
    const count: number = Math.floor(180 / step);
    if (!(step > 0))
      throw new RangeError(
        `A hand's turns need a positive spacing with a safe integer count of turns to the half turn, not ${step} degrees`,
      );
    const sense: number = side === "left" ? -1 : 1;
    const out: number[] = [0];
    for (let i: number = 1; i <= count; i++) {
      const k: number = i * step;

      // A quotient rounded up to a whole count can put its last multiple
      // past the half turn, which the list never holds.
      if (k > 180) break;
      out.push(...(k < 180 ? [sense * k, -sense * k] : [k]));
    }
    return out;
  }

  /*
   * Choose a pose's values.
   * Parameter problem: The tried values, the freedoms and the judge.
   * Returns: The chosen values and their worst miss.
   * When no values are tried.
   */
  export function chosen(
    problem: IAutoMovieMotionHumanFreedomChoice.IProblem,
  ): IAutoMovieMotionHumanFreedomChoice.IChoice {
    const { tried, freedoms, judge } = problem;
    if (tried.length === 0) throw new Error("A pose has no candidate");
    const within = (values: readonly number[]): number[] =>
      values.map((v: number, i: number): number => {
        const freedom: IAutoMovieMotionHumanFreedomChoice.Freedom =
          freedoms[i]!;
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
    const seeds: IChosenSeedsItem[] = [];
    for (const values of tried) {
      if (least <= EXACT) break;
      const v: number[] = within(values);
      const missed: number = worst(v, least);
      seeds.push({ values: v, miss: missed });
      if (missed < least - EXACT) {
        least = missed;
        best = v;
      }
    }

    // The pattern search from one start, its steps judged against the
    // start's own course, the budget shared by every start.
    let fits: number = 0;
    const search = (
      start: number[],
      missed: number,
      shares: readonly number[],
    ): IChosenSearchResult => {
      let here: number[] = start;
      let low: number = missed;
      for (const share of shares)
        for (let moved: boolean = true; moved; ) {
          moved = false;
          for (let d: number = 0; d < here.length && !moved; d++)
            for (const sign of [1, -1]) {
              const step: number = freedoms[d]!.step;
              if (low <= EXACT || fits >= FITS || step === 0) break;
              const v: number[] = within(
                here.map((x: number, i: number): number =>
                  i === d ? x + sign * share * step : x,
                ),
              );
              if (v[d] === here[d]) continue;
              fits++;
              const miss: number = worst(v, low);
              if (miss < low - EXACT) {
                low = miss;
                here = v;
                moved = true;
                break;
              }
            }
        }
      return { values: here, miss: low };
    };

    // A fitted body's miss over a freedom has many local least points (an
    // arm reaching a turned hat's crown holds exactly at one turn and misses
    // by a fifth of a metre 15 degrees away), so while nothing holds exactly
    // and the budget lasts the search starts again from each other tried
    // value, least missed first: a multistart local search (Marti,
    // "Multi-start methods", Handbook of Metaheuristics, 2003). A restart
    // refines inside its own value's half step, from half the step, since
    // the values a step away were tried themselves, and a value a finished
    // search ended within half a step of is not restarted.
    const ended: number[][] = [];
    const near = (a: readonly number[], b: readonly number[]): boolean =>
      a.every((x: number, i: number): boolean => {
        const freedom: IAutoMovieMotionHumanFreedomChoice.Freedom =
          freedoms[i]!;
        const gap: number = Math.abs(x - b[i]!);
        return (
          (freedom.kind === "wrapped"
            ? Math.min(gap, freedom.period - gap)
            : gap) <
          Math.abs(freedom.step) / 2
        );
      });

    // The least missed tried value starts first, as the single search did.
    const first: IChosenFirst = {
      values: best,
      miss: least,
    };
    for (const seed of [
      first,
      ...seeds
        .filter((s: IChosenS): boolean => s.values !== best)
        .sort((a: IChosenA, b: IChosenB): number => a.miss - b.miss),
    ]) {
      if (least <= EXACT || fits >= FITS) break;
      if (ended.some((end: number[]): boolean => near(seed.values, end)))
        continue;
      const found: IChosenFound = search(
        seed.values,
        seed.miss,
        seed === first ? REFINE : REFINE.slice(1),
      );
      ended.push(found.values);
      if (found.miss < least - EXACT) {
        least = found.miss;
        best = found.values;
      }
    }
    return { values: best, miss: least };
  }
}

/*
 * The record of `IChosenFound`'s site.
 */
type IChosenFound = { values: number[]; miss: number };

/*
 * The record of `IChosenB`'s site.
 */
type IChosenB = { miss: number };

/*
 * The record of `IChosenA`'s site.
 */
type IChosenA = { miss: number };

/*
 * The record of `IChosenS`'s site.
 */
type IChosenS = { values: number[] };

/*
 * The record of `IChosenFirst`'s site.
 */
type IChosenFirst = { values: number[]; miss: number };

/*
 * The record of `IChosenSearchResult`'s site.
 */
type IChosenSearchResult = { values: number[]; miss: number };

/*
 * The record of `IChosenSeedsItem`'s site.
 */
type IChosenSeedsItem = { values: number[]; miss: number };
