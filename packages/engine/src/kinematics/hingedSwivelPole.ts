import type { IAutoMovieQuaternion } from "@automovie/interface";

/**
 * The swivel of a hinged two-bone chain found from its pole: the swivel at
 * which the mid joint lies toward the bend hint, which two-bone IK takes as
 * the elbow's or knee's direction in closed form, then the local minimum of
 * the chain's full score around it.
 *
 * On each bend branch the search starts at the pole's swivel or, when the
 * caller's certified refusal (`excluded`, closed-form range arcs) refuses
 * its two-step bracket, at the nearest swivel, one step apart, whose bracket
 * it does not refuse; of two at the same distance either way the better
 * scored is kept. It then reads both neighbours, walks downhill one step at
 * a time toward the better one while the next step is strictly ahead under
 * the caller's ordering, and refines the two-step bracket around the step
 * reached by the golden-section search (`refineHingedSwivel`). Every choice
 * is made by the scores alone, never by a preferred direction, so a mirrored
 * request, whose swivel runs the other way, takes the mirrored path. When the
 * caller's score is the start's own term alone (`direct`) and nothing refused
 * the start, the start is the answer with no further candidate: the
 * admissible swivel nearest the desired one, Tolani, Goswami and Badler's
 * selection (2000, Graphical Models 62, section 3.2.4, p. 370). The
 * best branch result is returned. This is a
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
   * @evidence contracts/development/design.md#principled-representation The branch's scorer, its root and mid rotations at a swivel and its optional certified refusal.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Three members, each read by search.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The refusal is null rather than optional when the caller has none.
   */
  export interface IBranch<T> {
    /** The branch's scored candidate at a swivel, degrees. */
    probe: (angle: number) => T;

    /** The branch's bone-local root and mid rotations at a swivel, degrees, which the start reads. */
    posed: (angle: number) => { upper: IAutoMovieQuaternion; lower: IAutoMovieQuaternion };

    /** Whether every swivel from `low` to `high` degrees certainly overshoots; null when nothing is refused. */
    refused: ((low: number, high: number) => boolean) | null;
  }

  /**
   * Search every branch from its pole.
   *
   * @param props The branches, the start (read from each branch's poser), the ordering, the refinement, the step and whether the score is the start's term alone.
   * @returns The best branch result; null when a branch has no pole (a straight limb), so the caller's general search decides.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the null case.
   * @evidence contracts/development/implementation.md#principled-implementation The caller's closed-form start (the pole of two-bone IK, or a term's own minimiser) fixes the swivel; with a direct score the nearest admissible start is Tolani's selection, otherwise the downhill walk and golden refinement minimise the caller's full score in that start's basin under the caller's strict ordering.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop per branch: start, walk, refine, keep the best; start and direction are chosen by score, so the search has no direction-dependent tie-break beyond exactly equal scores.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A refused bracket moves the start; a branch with no unrefused swivel within half a turn is skipped; a missing pole returns null rather than guessing a side.
   * @evidence contracts/development/implementation.md#efficient-algorithms A direct score whose start is unrefused costs one start reading, the refusal test and one score per branch. Otherwise per branch one start reading, at most 360 refusal tests and at most two start scores, the two neighbours, one score per further step walked plus the one that stops it, and the refinement's scores: a start already at its minimum costs three scores and the refinement, against the sweep's 360 and every minimum's refinement.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure search of the caller's scorers.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Holds two candidates per branch until return.
   */
  export function search<T>(props: {
    branches: readonly IBranch<T>[];
    pole: (posed: IBranch<T>["posed"]) => number | null;
    better: (a: T, b: T) => boolean;
    refine: (probe: (angle: number) => T, angle: number) => T;
    step: number;
    direct?: boolean;
  }): T | null {
    let best: T | null = null;
    for (const branch of props.branches) {
      const peak: number | null = props.pole(branch.posed);
      if (peak === null || !Number.isFinite(peak)) return null;

      // The nearest swivel from the peak whose two-step bracket the range does
      // not certainly refuse. Two at the same distance, one either way, are
      // both scored and the better kept, so a request whose swivel runs the
      // other way (a mirror image) chooses the mirrored start.
      let at: number = peak;
      let here: T | null = null;
      for (let k: number = 0; here === null && k * props.step <= 180; ++k)
        for (const angle of k === 0 ? [peak] : [peak - k * props.step, peak + k * props.step]) {
          if (branch.refused !== null && branch.refused(angle - props.step, angle + props.step)) continue;
          const scored: T = branch.probe(angle);
          if (here === null || props.better(scored, here)) {
            at = angle;
            here = scored;
          }
        }
      if (here === null) continue;

      // A score that is the start's own term alone is least at the start
      // when nothing refused it: Tolani's selection, the admissible swivel
      // nearest the desired one, with no further candidate.
      if (props.direct === true && at === peak) {
        if (best === null || props.better(here, best)) best = here;
        continue;
      }

      // Downhill one step at a time toward the better neighbour, read on
      // both sides first so the direction depends on the scores alone, then
      // the refinement of the bracket around the step reached.
      const below: T = branch.probe(at - props.step);
      const above: T = branch.probe(at + props.step);
      const direction: number =
        props.better(above, here) && !props.better(below, above) ? 1
          : props.better(below, here) ? -1 : 0;
      if (direction !== 0) {
        at += direction * props.step;
        here = direction === 1 ? above : below;
        for (let k: number = 1; k * props.step < 360; ++k) {
          const next: T = branch.probe(at + direction * props.step);
          if (!props.better(next, here)) break;
          at += direction * props.step;
          here = next;
        }
      }
      const refined: T = props.refine(branch.probe, at);
      const kept: T = props.better(here, refined) ? here : refined;
      if (best === null || props.better(kept, best)) best = kept;
    }
    return best;
  }
}
