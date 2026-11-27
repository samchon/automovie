import type { IAutoMovieQuaternion } from "@automovie/interface";

/*
 * The swivel of a hinged two-bone chain found from its pole: the swivel at
 * which the mid joint lies toward the bend hint, which two-bone IK takes as the
 * elbow's or knee's direction in closed form, then the local minimum of the
 * chain's full score around it.
 *
 * On each bend branch the search starts at the pole's swivel or, when the
 * caller's certified refusal (`excluded`, closed-form range arcs) refuses its
 * two-step bracket, at the nearest swivel, one step apart, whose bracket it
 * does not refuse; of two at the same distance either way the better scored is
 * kept. It then reads both neighbours and walks downhill toward the better one
 * by a pattern search (Hooke and Jeeves 1961): steps doubling while the next is
 * strictly ahead under the caller's ordering, then halving back to one step,
 * trying the walk's direction first and then the other at each size; and
 * refines the two-step bracket around the swivel reached by the golden-section
 * search (`refineHingedSwivel`). Every choice is made by the scores alone,
 * never by a preferred direction, so a mirrored request, whose swivel runs the
 * other way, takes the mirrored path. When the caller's score is the start's
 * own term alone (`direct`) and nothing refused the start, the start is the
 * answer with no further candidate: the admissible swivel nearest the desired
 * one, Tolani, Goswami and Badler's selection (2000, Graphical Models 62,
 * section 3.2.4, p. 370). The best branch result is returned. This is a local
 * search: a basin far from the pole is not visited, so the result can differ
 * from a global sweep's where that sweep would jump to a far swivel; the caller
 * decides when the result is final (`hingedArmArticulation` returns it only
 * when legal).
 */
export namespace hingedSwivelPole {
  /*
   * One bend branch as the search reads it.
   */
  export interface IBranch<T> {
    /*
     * The branch's scored candidate at a swivel, degrees.
     */
    probe: (angle: number) => T;

    /*
     * The branch's bone-local root and mid rotations at a swivel, degrees,
     * which the start reads.
     */
    posed: (angle: number) => {
      upper: IAutoMovieQuaternion;
      lower: IAutoMovieQuaternion;
    };

    /*
     * Whether every swivel from `low` to `high` degrees certainly overshoots;
     * null when nothing is refused.
     */
    refused: ((low: number, high: number) => boolean) | null;
  }

  /*
   * Search every branch from its pole.
   * Parameter props: The branches, the start (read from each branch's poser), the
   * ordering, the refinement, the step and whether the score is the start's
   * term alone.
   * Returns: The best branch result; null when a branch has no pole (a straight
   * limb), so the caller's general search decides.
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
      if (peak === null) return null;

      // The nearest swivel from the peak whose two-step bracket the range does
      // not certainly refuse. Two at the same distance, one either way, are
      // both scored and the better kept, so a request whose swivel runs the
      // other way (a mirror image) chooses the mirrored start.
      let at: number = peak;
      let here: T | null = null;
      for (let k: number = 0; here === null && k * props.step <= 180; ++k)
        for (const angle of k === 0
          ? [peak]
          : [peak - k * props.step, peak + k * props.step]) {
          if (
            branch.refused !== null &&
            branch.refused(angle - props.step, angle + props.step)
          )
            continue;
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
        props.better(above, here) && !props.better(below, above)
          ? 1
          : props.better(below, here)
            ? -1
            : 0;
      if (direction !== 0) {
        at += direction * props.step;
        here = direction === 1 ? above : below;

        // A pattern search: steps doubling while the score improves, then
        // halving back to one step, either way at each size and the walk's
        // own direction first, so a start far from its minimum costs scores
        // in the logarithm of the distance rather than one per step.
        let size: number = 2 * props.step;
        let travelled: number = props.step;
        while (travelled + size <= 360) {
          const next: T = branch.probe(at + direction * size);
          if (!props.better(next, here)) break;
          at += direction * size;
          here = next;
          travelled += size;
          size *= 2;
        }
        for (size /= 2; size >= props.step; size /= 2)
          for (const way of [direction, -direction]) {
            const next: T = branch.probe(at + way * size);
            if (props.better(next, here)) {
              at += way * size;
              here = next;
              break;
            }
          }
      }
      const refined: T = props.refine(branch.probe, at);
      const kept: T = props.better(here, refined) ? here : refined;
      if (best === null || props.better(kept, best)) best = kept;
    }
    return best;
  }
}
