import { hingedArmSwivel } from "./hingedArmSwivel";
import { hingedSwivelAhead } from "./hingedSwivelAhead";

/** The articulation's swivel step, degrees (`hingedArmSwivel.STEP`). */
const STEP: number = hingedArmSwivel.STEP;

/**
 * The cold swivel sweep of `hingedArmArticulation` decided by branch and
 * bound (Land and Doig 1960): the same candidates, local minima,
 * refinements and choice as the full sweep, with a step scored only when its
 * value can still matter.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the method, its source and what stays the sweep's; `sweep` states the premise and the proof.
 * @evidence contracts/development/design.md#principled-representation A branch's scorer, caches, refusal and certified bound; a candidate's comparator keys.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Two records and the search, all read by `hingedArmArticulation`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The score keys are the comparator's own (`hingedSwivelAhead`) and the caches the articulation's, shared with its full pass.
 */
export namespace hingedSwivelBounded {
  /**
   * A candidate's comparator keys.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning.
   * @evidence contracts/development/design.md#principled-representation The keys `hingedSwivelAhead` compares.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The members the comparator and this search read.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None added.
   */
  export interface IScore {
    /** ROM overshoot plus obstruction, degrees; zero is legal. */
    overshoot: number;

    /** The deviation, or its lower bound when `exact` is given. */
    deviation: number;

    /** The exact deviation. */
    exact?: () => number;

    /** The exact deviation once read. */
    known?: number;

    /** A second key, unused by this search's policy. */
    tiebreak?: () => number;

    /** The second key once read. */
    second?: number;
  }

  /**
   * One bend branch of the sweep.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning, unit and owner.
   * @evidence contracts/development/design.md#principled-representation The branch's scorer, its completed work, its refusal and its certified bound.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Five members, all read by the search.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The caches are the articulation's, shared with its full pass.
   */
  export interface IBranch<T> {
    /** The actual scorer at a swivel, degrees. */
    probe: (angle: number) => T;

    /** Completed step candidates, indexed by sweep step. */
    steps: (T | undefined)[];

    /** Completed refinements, keyed by the step whose bracket they refine. */
    refined: Map<number, T>;

    /** Whether every swivel from `low` to `high` degrees is certain to overshoot; none to refuse nothing. */
    refused: ((low: number, high: number) => boolean) | null;

    /** A certified lower bound of the exact deviation of every candidate at a swivel from `low` to `high` degrees. */
    bound: (low: number, high: number) => number;
  }

  /**
   * The sweep's choice over the branches, in their order.
   *
   * The steps of a branch are visited in the order of their bracket's bound
   * (the step and its refinement, a step either way), and the visit stops at
   * the first whose bound exceeds the least exact deviation of a legal
   * (zero-overshoot) candidate already read. A step not visited, and the
   * refinement of its bracket, are strictly behind that legal candidate, so
   * behind the full sweep's choice, and leaving strictly worse candidates
   * out of a first-of-equals choice changes nothing. Every candidate the
   * full sweep could choose has a bracket bound at most the final least
   * deviation, so its step is visited. A visited step decides whether it is a
   * local minimum against its two neighbours as the sweep does: a neighbour
   * whose own bound exceeds a legal step's exact deviation is behind it
   * without being scored, and any other neighbour is scored. The choice is
   * then folded over the scored steps and the visited minima's refinements
   * in the sweep's own order, so ties keep the same candidate.
   *
   * The proof needs exact deviation ties (no tie band) and no
   * first-candidate certificate, the articulation's continuous-cost policy,
   * which is the only one it calls this with.
   *
   * @param props The branches with their scorers, caches, refusals and bounds; the candidate order; the refinement.
   * @returns The chosen candidate, none when every step is refused, and whether any step was refused.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the order, the stop, why skipped candidates cannot change the choice or a minimum, the fold and the premise.
   * @evidence contracts/development/implementation.md#principled-implementation Branch and bound with a certified lower bound: a candidate whose bound exceeds an actual legal candidate's exact deviation is strictly behind it in the lexicographic order (legality first, exact deviation second), so it is never the sweep's choice and never decides another step's refinement differently.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Per branch: the refusals, the bounded visit with its exact local-minimum tests, then the sweep-ordered fold.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No step, tolerance, refinement count or score changes; a bound that cannot decide scores the candidate, and a sweep with no legal candidate visits every unrefused step.
   * @evidence contracts/development/implementation.md#efficient-algorithms Two constant bound reads per step and one sort of at most 360 steps per branch; scoring, refinement and obstruction work run only for the steps the bound cannot exclude. Unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Scored steps and refinements land in the branch's caches, which the articulation's full fallback pass reads again under the same unchanged score.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Per-branch bound and order arrays and one set of minima live until return; candidates go to the caller's caches.
   */
  export function sweep<T extends IScore>(props: {
    branches: readonly IBranch<T>[];
    better: (a: T, b: T) => boolean;
    refine: (probe: (angle: number) => T, angle: number) => T;
  }): { chosen: T | null; skipped: boolean } {
    let chosen: T | null = null;
    let skipped: boolean = false;
    let best: number = Infinity;
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
      const at: number[] = [];
      const bracket: number[] = [];
      const order: number[] = [];
      for (let step: number = 0; step < count; ++step) {
        at[step] = branch.bound(step * STEP, step * STEP);
        bracket[step] = branch.bound(step * STEP - STEP, step * STEP + STEP);
        if (!out[step]) order.push(step);
      }
      order.sort(
        (a: number, b: number): number => bracket[a]! - bracket[b]! || a - b,
      );
      const value = (step: number): T =>
        (branch.steps[step] ??= branch.probe(step * STEP));
      const note = (candidate: T): void => {
        if (candidate.overshoot === 0)
          best = Math.min(best, hingedSwivelAhead.exact(candidate));
      };

      // A legal candidate is ahead of the step at `k` without scoring it
      // when that step's bound already exceeds its exact deviation.
      const dominates = (candidate: T, k: number): boolean =>
        candidate.overshoot === 0 &&
        at[k]! > hingedSwivelAhead.exact(candidate);
      const minima: Set<number> = new Set();
      for (const step of order) {
        if (bracket[step]! > best) break;
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
        const scored: T | undefined = out[step] ? undefined : branch.steps[step];
        if (scored === undefined) continue;
        if (chosen === null || props.better(scored, chosen)) chosen = scored;
        if (minima.has(step)) {
          const refined: T = branch.refined.get(step)!;
          if (props.better(refined, chosen)) chosen = refined;
        }
      }
    }
    return { chosen, skipped };
  }
}
