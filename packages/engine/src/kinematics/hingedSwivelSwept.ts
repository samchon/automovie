import { hingedArmSwivel } from "./hingedArmSwivel";

/** The articulation's swivel step, degrees (`hingedArmSwivel.STEP`). */
const STEP: number = hingedArmSwivel.STEP;

/**
 * The full cold swivel sweep of `hingedArmArticulation`: every step a certified
 * refusal does not spare is scored, every local minimum refined, and the first
 * of the best kept; and the sweep's first-candidate certificate, which
 * `hingedSwivelBounded`'s caller tests the same way.
 */
export namespace hingedSwivelSwept {
  /** One bend branch of the sweep. */
  export interface IBranch<T> {
    /** The actual scorer at a swivel, degrees. */
    probe: (angle: number) => T;

    /** Completed step candidates, indexed by sweep step. */
    steps: (T | undefined)[];

    /** Completed refinements, keyed by the step whose bracket they refine. */
    refined: Map<number, T>;

    /**
     * Whether every swivel from `low` to `high` degrees is certain to
     * overshoot; none to refuse nothing.
     */
    refused: ((low: number, high: number) => boolean) | null;
  }

  /**
   * The first candidate the sweep scores, in branch and step order: the first
   * step whose swivels within two steps of it are not all refused.
   *
   * @param branches The branches, in the sweep's order.
   * @returns That candidate, scored into its branch's cache, and whether a step
   *   before it was refused; no candidate when every step of every branch is
   *   refused.
   */
  export function first<T>(branches: readonly IBranch<T>[]): {
    candidate: T | null;
    skipped: boolean;
  } {
    let skipped: boolean = false;
    for (const branch of branches)
      for (let step: number = 0; step * STEP < 360; ++step) {
        const angle: number = step * STEP;
        if (
          branch.refused !== null &&
          branch.refused(angle - 2 * STEP, angle + 2 * STEP)
        ) {
          skipped = true;
          continue;
        }
        return {
          candidate: (branch.steps[step] ??= branch.probe(angle)),
          skipped,
        };
      }
    return { candidate: null, skipped };
  }

  /**
   * The sweep's choice over the branches, in their order.
   *
   * A step is skipped when the swivels within two steps of it are refused, and
   * a step whose bracket (a step either way) is refused, or one of whose
   * neighbours was skipped, is not refined. Every local minimum of the scored
   * steps is refined, not only the best step: a legal sliver narrower than one
   * step shows in the sweep only as a dip of the overshoot, and of two basins
   * the one that is truly better must win, not the one whose sample fell nearer
   * its bottom. A step level with both neighbours has nothing to refine. The
   * first scored candidate ends the search when the caller's certificate
   * accepts it (`certified`).
   *
   * @param props The branches with their scorers, caches and refusals; the
   *   candidate order; the refinement; the first candidate's certificate when
   *   the caller has one.
   * @returns The chosen candidate, none when every step is refused, and whether
   *   any step was refused before the search ended.
   */
  export function sweep<T>(props: {
    branches: readonly IBranch<T>[];
    better: (a: T, b: T) => boolean;
    refine: (probe: (angle: number) => T, angle: number) => T;
    certified?: (candidate: T) => boolean;
  }): { chosen: T | null; skipped: boolean } {
    let chosen: T | null = null;
    let skipped: boolean = false;
    let opening: boolean = true;
    for (const branch of props.branches) {
      const swept: (T | null)[] = [];
      for (let step: number = 0; step * STEP < 360; ++step) {
        const angle: number = step * STEP;
        const out: boolean =
          branch.refused !== null &&
          branch.refused(angle - 2 * STEP, angle + 2 * STEP);
        if (out) {
          skipped = true;
          swept.push(null);
          continue;
        }
        const candidate: T = (branch.steps[step] ??= branch.probe(angle));
        if (
          opening &&
          props.certified !== undefined &&
          props.certified(candidate)
        )
          return { chosen: candidate, skipped };
        opening = false;
        swept.push(candidate);
      }
      for (let step: number = 0; step < swept.length; ++step) {
        const at: T | null = swept[step]!;
        if (at === null) continue;
        const before: T | null =
          swept[(step + swept.length - 1) % swept.length]!;
        const after: T | null = swept[(step + 1) % swept.length]!;
        if (chosen === null || props.better(at, chosen)) chosen = at;
        if (before === null || after === null) continue;
        if (
          branch.refused !== null &&
          branch.refused(step * STEP - STEP, step * STEP + STEP)
        )
          continue;
        if (props.better(before, at) || props.better(after, at)) continue;
        if (!props.better(at, before) && !props.better(at, after)) continue;
        let refined: T | undefined = branch.refined.get(step);
        if (refined === undefined) {
          refined = props.refine(branch.probe, step * STEP);
          branch.refined.set(step, refined);
        }
        if (props.better(refined, chosen)) chosen = refined;
      }
    }
    return { chosen, skipped };
  }
}
