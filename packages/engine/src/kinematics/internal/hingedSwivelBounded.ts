import { AutoMovieEngineHingedArmSwivel } from "../AutoMovieEngineHingedArmSwivel";
import { hingedSwivelAhead } from "./hingedSwivelAhead";

/*
 * The cold swivel sweep of `hingedArmArticulation` decided by branch and bound
 * (Land and Doig 1960): the same candidates, local minima, refinements and
 * choice as the full sweep, with a step scored only when its value can still
 * matter.
 */
export namespace hingedSwivelBounded {
  /*
   * A candidate's comparator keys.
   */
  export interface IScore {
    /*
     * ROM overshoot plus obstruction, degrees; zero is legal.
     */
    overshoot: number;

    /*
     * The deviation, or its lower bound when `exact` is given.
     */
    deviation: number;

    /*
     * The exact deviation.
     */
    exact?: () => number;

    /*
     * The exact deviation once read.
     */
    known?: number;

    /*
     * A second key, unused by this search's policy.
     */
    tiebreak?: () => number;

    /*
     * The second key once read.
     */
    second?: number;
  }

  /*
   * One bend branch of the sweep.
   */
  export interface IBranch<T> {
    /*
     * The actual scorer at a swivel, degrees.
     */
    probe: (angle: number) => T;

    /*
     * Completed step candidates, indexed by sweep step.
     */
    steps: (T | undefined)[];

    /*
     * Completed refinements, keyed by the step whose bracket they refine.
     */
    refined: Map<number, T>;

    /*
     * Whether every swivel from `low` to `high` degrees is certain to
     * overshoot; none to refuse nothing.
     */
    refused: ((low: number, high: number) => boolean) | null;

    /*
     * A certified lower bound of the exact deviation of every candidate at a
     * swivel from `low` to `high` degrees.
     */
    bound: (low: number, high: number) => number;
  }

  /*
   * The sweep's choice over the branches, in their order.
   *
   * The steps of a branch are visited in the order of their bracket's bound
   * (the step and its refinement, a step either way), and the visit stops at
   * the first whose bound exceeds the least exact deviation of a legal
   * (zero-overshoot) candidate already read. A step not visited, and the
   * refinement of its bracket, are strictly behind that legal candidate, so
   * behind the full sweep's choice, and leaving strictly worse candidates out
   * of a first-of-equals choice changes nothing. Every candidate the full sweep
   * could choose has a bracket bound at most the final least deviation, so its
   * step is visited. A visited step decides whether it is a local minimum
   * against its two neighbours as the sweep does: a neighbour whose own bound
   * exceeds a legal step's exact deviation is behind it without being scored,
   * and any other neighbour is scored. The choice is then folded over the
   * scored steps and the visited minima's refinements in the sweep's own order,
   * so ties keep the same candidate.
   *
   * With a tie width (`tie`) the comparator ranks a deviation by its bucket of
   * that width and decides equal buckets by a second key this search has no
   * bound of. The same argument holds on the buckets: the bucket is monotone in
   * the deviation, so a bound whose bucket exceeds a legal candidate's exact
   * bucket marks candidates strictly behind it, and every step whose bracket
   * may hold a candidate of the least bucket is visited and its second key
   * read. The proof needs the comparator to be a total preorder, which the
   * buckets make it, and no first-candidate certificate: the articulation tests
   * that certificate itself before calling this.
   * Parameter props: The branches with their scorers, caches, refusals and bounds;
   * the candidate order; the refinement; the comparator's tie width when it
   * has one; and the exact deviation of a legal candidate the caller read
   * (`incumbent`), which starts the visit's stop: kept where the choice is
   * legal and no worse than it, every unvisited bracket then holding only
   * candidates strictly behind the choice, and dropped otherwise for the
   * visit without it.
   * Returns: The chosen candidate, none when every step is refused, and whether
   * any step was refused.
   */
  export function sweep<T extends IScore>(props: {
    branches: readonly IBranch<T>[];
    better: (a: T, b: T) => boolean;
    refine: (probe: (angle: number) => T, angle: number) => T;
    tie?: number;
    incumbent?: number;
  }): { chosen: T | null; skipped: boolean } {
    let chosen: T | null = null;
    let skipped: boolean = false;

    // The key the comparator ranks a deviation by: itself, or its bucket
    // under a tie width (`hingedSwivelAhead.rank`). Monotone either way, so
    // a bound's key never exceeds its exact value's.
    const tie: number | undefined = props.tie;
    const key = (deviation: number): number =>
      tie === undefined ? deviation : hingedSwivelAhead.rank(deviation, tie);

    // A legal candidate's exact deviation the caller has read off the sweep
    // (`incumbent`) stops the visit from the start, as one read here would.
    const incumbent: number | undefined =
      props.incumbent === undefined ? undefined : key(props.incumbent);
    let best: number = incumbent ?? Infinity;
    let count: number = 0;
    while (count * STEP < 360) ++count;
    for (const branch of props.branches) {
      // The steps the refusal spares, as the sweep spares them.
      const out: boolean[] = [];
      for (let step: number = 0; step < count; ++step) {
        const angle: number = step * STEP;
        out[step] =
          branch.refused !== null &&
          branch.refused(angle - 2 * STEP, angle + 2 * STEP);
        if (out[step]) skipped = true;
      }
      // A step's own bound is read only for the neighbours of a visited
      // step, so it is read on demand. Only admitted brackets enter the visit.
      const own: (number | undefined)[] = [];
      const at = (step: number): number =>
        (own[step] ??= branch.bound(step * STEP, step * STEP));
      const bracket: number[] = [];
      const order: number[] = [];
      for (let step: number = 0; step < count; ++step) {
        if (out[step]) continue;
        bracket[step] = branch.bound(step * STEP - STEP, step * STEP + STEP);
        order.push(step);
      }
      order.sort(
        (a: number, b: number): number => bracket[a]! - bracket[b]! || a - b,
      );
      const value = (step: number): T =>
        (branch.steps[step] ??= branch.probe(step * STEP));
      const note = (candidate: T): void => {
        if (candidate.overshoot === 0)
          best = Math.min(best, key(hingedSwivelAhead.exact(candidate)));
      };

      // A legal candidate is ahead of the step at `k` without scoring it
      // when that step's bound already exceeds its exact deviation.
      const dominates = (candidate: T, k: number): boolean =>
        candidate.overshoot === 0 &&
        key(at(k)) > key(hingedSwivelAhead.exact(candidate));
      const minima: Set<number> = new Set();
      for (const step of order) {
        if (key(bracket[step]!) > best) break;
        const here: T = value(step);
        note(here);
        const before: number = (step + count - 1) % count;
        const after: number = (step + 1) % count;
        if (out[before] || out[after]) continue;
        if (
          branch.refused !== null &&
          branch.refused(step * STEP - STEP, step * STEP + STEP)
        )
          continue;
        const ahead = (k: number): boolean =>
          !dominates(here, k) && props.better(value(k), here);
        const behind = (k: number): boolean =>
          dominates(here, k) || props.better(here, value(k));
        if (ahead(before) || ahead(after)) continue;
        if (!behind(before) && !behind(after)) continue;
        let refined: T | undefined = branch.refined.get(step);
        if (refined === undefined) {
          refined = props.refine(branch.probe, step * STEP);
          branch.refined.set(step, refined);
        }
        note(refined);
        minima.add(step);
      }

      // The sweep's own first-of-equals choice over what was read.
      for (let step: number = 0; step < count; ++step) {
        const scored: T | undefined = out[step]
          ? undefined
          : branch.steps[step];
        if (scored === undefined) continue;
        if (chosen === null || props.better(scored, chosen)) chosen = scored;
        if (minima.has(step)) {
          const refined: T = branch.refined.get(step)!;
          if (props.better(refined, chosen)) chosen = refined;
        }
      }
    }

    // The incumbent is the caller's candidate, not necessarily one of the
    // sweep's: every bracket it left unvisited holds candidates strictly
    // behind it, so behind the choice only where the choice is legal and no
    // worse than it. Elsewhere the sweep decides without it, on the steps and
    // refinements already read.
    if (
      incumbent !== undefined &&
      !(
        chosen !== null &&
        chosen.overshoot === 0 &&
        key(hingedSwivelAhead.exact(chosen)) <= incumbent
      )
    )
      return sweep({
        branches: props.branches,
        better: props.better,
        refine: props.refine,
        ...(props.tie === undefined ? {} : { tie: props.tie }),
      });
    return { chosen, skipped };
  }
}

/*
 * The articulation's swivel step, degrees (`AutoMovieEngineHingedArmSwivel.STEP`).
 */
const STEP: number = AutoMovieEngineHingedArmSwivel.STEP;
