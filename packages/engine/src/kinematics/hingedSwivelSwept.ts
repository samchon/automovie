import { hingedArmSwivel } from "./hingedArmSwivel";

/** The articulation's swivel step, degrees (`hingedArmSwivel.STEP`). */
const STEP: number = hingedArmSwivel.STEP;

/**
 * The full cold swivel sweep of `hingedArmArticulation`: every step a
 * certified refusal does not spare is scored, every local minimum refined,
 * and the first of the best kept; and the sweep's first-candidate
 * certificate, which `hingedSwivelBounded`'s caller tests the same way.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the sweep scores, refines and keeps, and what shares its certificate; `sweep` and `first` state their rules.
 * @evidence contracts/development/design.md#principled-representation A branch's scorer, its caches and its refusal; the candidate order and the certificate are the caller's.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One record and two functions, all read by `hingedArmArticulation`; split from it unchanged to keep that file within its size.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The caches are the articulation's, shared with its pruned and bounded passes; no score, tolerance or step is this module's.
 */
export namespace hingedSwivelSwept {
  /**
   * One bend branch of the sweep.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning, unit and owner.
   * @evidence contracts/development/design.md#principled-representation The branch's scorer, its completed work and its refusal.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Four members, all read by the sweep.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The caches are the articulation's, shared between its passes.
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
  }

  /**
   * The first candidate the sweep scores, in branch and step order: the
   * first step whose swivels within two steps of it are not all refused.
   *
   * @param branches The branches, in the sweep's order.
   * @returns That candidate, scored into its branch's cache, and whether a step before it was refused; no candidate when every step of every branch is refused.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States which candidate is first, where it is kept and the empty case.
   * @evidence contracts/development/implementation.md#principled-implementation The sweep's own visiting order and refusal test, so a certificate tested on this candidate is tested on the candidate the sweep would test it on.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One scan to the first unrefused step and one score.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The candidate is actually scored; nothing is assumed of it.
   * @evidence contracts/development/implementation.md#efficient-algorithms At most one refusal test a step up to the first unrefused one, and one score.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The candidate lands in the branch's step cache, which every later pass reads.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing beyond the caller's cache.
   */
  export function first<T>(
    branches: readonly IBranch<T>[],
  ): { candidate: T | null; skipped: boolean } {
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
   * A step is skipped when the swivels within two steps of it are refused,
   * and a step whose bracket (a step either way) is refused, or one of whose
   * neighbours was skipped, is not refined. Every local minimum of the
   * scored steps is refined, not only the best step: a legal sliver narrower
   * than one step shows in the sweep only as a dip of the overshoot, and of
   * two basins the one that is truly better must win, not the one whose
   * sample fell nearer its bottom. A step level with both neighbours has
   * nothing to refine. The first scored candidate ends the search when the
   * caller's certificate accepts it (`certified`).
   *
   * @param props The branches with their scorers, caches and refusals; the candidate order; the refinement; the first candidate's certificate when the caller has one.
   * @returns The chosen candidate, none when every step is refused, and whether any step was refused before the search ended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the skip, the refinement rule and its reason, the certificate and the result.
   * @evidence contracts/development/implementation.md#principled-implementation An exhaustive sweep at the articulation's step with a golden-section refinement of each local minimum (Kiefer 1953) under the caller's complete ordering; a certified refusal spares only candidates that cannot be legal.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Per branch: the scored steps, then the fold with each minimum's refinement, in step order.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No step, tolerance or score is this function's; the certificate is tested on an actual scored candidate only.
   * @evidence contracts/development/implementation.md#efficient-algorithms 360 steps a branch less the refused ones, plus one refinement per local minimum; a certified first candidate costs one score.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Scored steps and refinements are read from and written to the branch's caches, shared with the articulation's other passes under the same unchanged score.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One array of at most 360 step references a branch lives until return; candidates stay in the caller's caches.
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
        if (opening && props.certified !== undefined && props.certified(candidate))
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
