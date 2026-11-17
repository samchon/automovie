import type { IAutoMovieQuaternion } from "@automovie/interface";

/**
 * The swivel of a hinged two-bone chain found from its pole: the swivel at
 * which the mid joint lies toward the bend hint, which two-bone IK takes as
 * the elbow's or knee's direction in closed form, then the local minimum of
 * the chain's full score around it.
 *
 * On each bend branch the search starts at the pole's swivel or, when the
 * caller's certified refusal (`excluded`, closed-form range arcs) refuses
 * its two-step bracket, at the nearest swivel either way, one step apart,
 * whose bracket it does not refuse. From there it walks downhill one step at
 * a time, first toward increasing swivel and then toward decreasing, while
 * the next step is strictly ahead under the caller's ordering, and refines
 * the two-step bracket around the step reached by the golden-section search
 * (`refineHingedSwivel`). The best branch result is returned. This is a
 * local search: a basin far from the pole is not visited, so the result can
 * differ from a global sweep's where that sweep would jump to a far swivel;
 * the caller decides when the result is final (`hingedArmArticulation`
 * returns it only when legal).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the start, the refusal fallback, the downhill walk, the refinement and that the search is local.
 * @evidence contracts/development/design.md#principled-representation Degree-valued swivels on each branch, a caller-owned strict ordering and certified interval refusal.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One branch record and one search serve hingedArmArticulation's cold pole path.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scores and ordering stay the caller's; no limb, rig or target is named.
 */
export namespace hingedSwivelPole {
  /**
   * One bend branch as the search reads it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its unit and use.
   * @evidence contracts/development/design.md#principled-representation The branch's scorer, its root rotation at a swivel and its optional certified refusal.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Three members, each read by search.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The refusal is null rather than optional when the caller has none.
   */
  export interface IBranch<T> {
    /** The branch's scored candidate at a swivel, degrees. */
    probe: (angle: number) => T;

    /** The root's bone-local rotation at a swivel, degrees, which the pole reads. */
    upper: (angle: number) => IAutoMovieQuaternion;

    /** Whether every swivel from `low` to `high` degrees certainly overshoots; null when nothing is refused. */
    refused: ((low: number, high: number) => boolean) | null;
  }

  /**
   * Search every branch from its pole.
   *
   * @param props The branches, the pole, the ordering, the refinement and the step.
   * @returns The best branch result; null when a branch has no pole (a straight limb), so the caller's general search decides.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the null case.
   * @evidence contracts/development/implementation.md#principled-implementation The pole of two-bone IK fixes the mid joint's direction in closed form; the downhill walk and golden refinement then minimise the caller's full score in that start's basin under the caller's strict ordering.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop per branch: start, walk, refine, keep the best.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A refused bracket moves the start; a branch with no unrefused swivel within half a turn is skipped; a missing pole returns null rather than guessing a side.
   * @evidence contracts/development/implementation.md#efficient-algorithms Per branch one pole reading, at most 360 refusal tests to find the start, one score per step walked plus one that stops each direction, and the refinement's scores: a start already at its minimum costs three scores and the refinement, against the sweep's 360 and every minimum's refinement.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure search of the caller's scorers.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Holds two candidates per branch until return.
   */
  export function search<T>(props: {
    branches: readonly IBranch<T>[];
    pole: (upper: (swivel: number) => IAutoMovieQuaternion) => number | null;
    better: (a: T, b: T) => boolean;
    refine: (probe: (angle: number) => T, angle: number) => T;
    step: number;
  }): T | null {
    let best: T | null = null;
    for (const branch of props.branches) {
      const peak: number | null = props.pole(branch.upper);
      if (peak === null || !Number.isFinite(peak)) return null;

      // The nearest swivel, either way from the peak, whose two-step bracket
      // the range does not certainly refuse.
      let start: number | null = null;
      for (let k: number = 0; start === null && k * props.step <= 180; ++k)
        for (const angle of k === 0 ? [peak] : [peak - k * props.step, peak + k * props.step])
          if (branch.refused === null || !branch.refused(angle - props.step, angle + props.step)) {
            start = angle;
            break;
          }
      if (start === null) continue;

      // Downhill one step at a time, one way and then the other, then the
      // refinement of the bracket around the step reached.
      let at: number = start;
      let here: T = branch.probe(at);
      for (const direction of [1, -1])
        for (let k: number = 0; k * props.step < 360; ++k) {
          const next: T = branch.probe(at + direction * props.step);
          if (!props.better(next, here)) break;
          at += direction * props.step;
          here = next;
        }
      const refined: T = props.refine(branch.probe, at);
      const kept: T = props.better(here, refined) ? here : refined;
      if (best === null || props.better(kept, best)) best = kept;
    }
    return best;
  }
}
