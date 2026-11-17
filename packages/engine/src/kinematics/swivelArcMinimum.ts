import type { IAutoMovieSwivelArcs } from "@automovie/interface";

import { hingedArmSwivel } from "./hingedArmSwivel";

/** The articulation's swivel step, degrees (`hingedArmSwivel.STEP`). */
const STEP: number = hingedArmSwivel.STEP;

/**
 * The cold swivel search of `hingedArmArticulation` over arcs of swivels the
 * caller names in closed form, instead of over the whole turn: the same grid
 * steps, the same local-minimum rule, the same refinement and the same
 * first-of-equals choice as `hingedSwivelSwept.sweep`, on the arcs alone,
 * with each arc's two ends as candidates of their own.
 *
 * A caller has arcs where its score's first keys are known without scoring:
 * the swivels a joint's box admits (`swivelArcs`, read by
 * `boxExcludedSwivels`), the swivels at which an end joint's box takes where
 * the mid segment points (`distalEndSwivelArcs`), and the swivels at which a
 * distally twisting mid segment takes the twist left to it
 * (`distalTwistSwivelRange.breaks` with one `admits` test at an arc's
 * middle). Their ends are exact roots of sinusoids of the swivel, so a legal
 * interval narrower than one step is an arc with two ends, each a candidate,
 * where the full sweep finds it only by the dip it leaves in a step's score.
 *
 * The spacing inside an arc is the sweep's own step and the refinement the
 * sweep's own, so this search asks nothing new of a score: a candidate at a
 * grid step inside an arc is the candidate the sweep scores there, and its
 * refinement differs only in its probes being held inside the arc. No
 * coarser spacing is offered, because none follows from the scores' terms:
 * a clinical angle of a rotation turned by the swivel is an arctangent of
 * two sinusoids and a sum of such squares has no least basin width this
 * module could state.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is searched, where the arcs come from, why their ends are candidates, the spacing's basis and what is deliberately not offered.
 * @evidence contracts/development/design.md#principled-representation Arcs are `swivelArcs.IArc`, degrees; a candidate is whatever the caller's prober returns, ordered by the caller's own comparator.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One record of inputs and one search. Gap: no caller reads it yet; it is written for `fitHingedChainCandidate`'s strain fit of a requested rotation, whose admissible swivels are closed-form arcs, and lands ahead of that wiring. The step and the arcs' type are their owners'.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No score, tolerance, step or spacing is this module's; the bound is optional because a caller without one visits every arc.
 */
export namespace swivelArcMinimum {
  /**
   * What the search is given.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning, unit and owner.
   * @evidence contracts/development/design.md#principled-representation The arcs, the scorer, the order, the refinement and an optional certified bound with the key it bounds.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Four members every caller passes and one optional pair read together.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The bound and its key are one member, so neither is given without the other.
   */
  export interface IProps<T> {
    /** The arcs searched, degrees, in the order ties are resolved in; an arc a full turn wide or wider is the whole circle. */
    arcs: readonly IAutoMovieSwivelArcs.IArc[];

    /**
     * The actual scorer at a swivel, degrees; periodic over a turn.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the argument's unit and the candidate returned.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation A slot its caller fills; the interface declares it and implements nothing.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure A slot its caller fills; the interface declares it and implements nothing.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts A slot its caller fills; the interface declares it and implements nothing.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A slot its caller fills; the interface declares it and implements nothing.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A slot its caller fills; the interface declares it and implements nothing.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A slot its caller fills; the interface declares it and implements nothing.
     */
    probe: (swivel: number) => T;

    /**
     * Whether the first candidate is strictly ahead of the second (`hingedSwivelAhead`).
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the strict ordering the two candidates are compared by.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation A slot its caller fills; the interface declares it and implements nothing.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure A slot its caller fills; the interface declares it and implements nothing.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts A slot its caller fills; the interface declares it and implements nothing.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A slot its caller fills; the interface declares it and implements nothing.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A slot its caller fills; the interface declares it and implements nothing.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A slot its caller fills; the interface declares it and implements nothing.
     */
    better: (a: T, b: T) => boolean;

    /**
     * The refinement of the two-step bracket about a swivel, degrees, with a scorer (`refineHingedSwivel` at the articulation's pass count).
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the arguments and the refined candidate returned.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation A slot its caller fills; the interface declares it and implements nothing.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure A slot its caller fills; the interface declares it and implements nothing.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts A slot its caller fills; the interface declares it and implements nothing.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A slot its caller fills; the interface declares it and implements nothing.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A slot its caller fills; the interface declares it and implements nothing.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A slot its caller fills; the interface declares it and implements nothing.
     */
    refine: (probe: (swivel: number) => T, swivel: number) => T;

    /**
     * Branch and bound over the arcs (Land and Doig 1960): `below` is a
     * certified lower bound of `key` over every candidate at a swivel from
     * `low` to `high` degrees, and `key` the number a candidate is ranked by
     * among those that can be chosen, or null for a candidate no bound may
     * be compared with (an illegal one). Arcs are then visited in the order
     * of their bounds and the visit ends at the first whose bound exceeds
     * the least key read; absent, every arc is visited.
     */
    bounded?: {
      below: (low: number, high: number) => number;
      key: (candidate: T) => number | null;
    };
  }

  /**
   * The best candidate over the arcs.
   *
   * On an arc the candidates are its start, every grid step
   * (`hingedArmSwivel.STEP`) inside it and its end. A candidate with a
   * neighbour either side that neither neighbour is ahead of, and that is
   * ahead of one of them, is a local minimum and is refined
   * (`hingedSwivelSwept.sweep`'s rule); the refinement's probes are held
   * inside the arc, since a swivel outside it is not a candidate, which
   * leaves the score continuous and its minima on the arc unchanged. An
   * arc's end has one neighbour and is a candidate only: a minimum at an end
   * is the end itself. An arc a full turn wide is the circle, its steps
   * neighbours round the turn and its refinement unheld, which is the full
   * sweep of one branch.
   *
   * The choice is folded over the visited arcs in the order given, each
   * arc's candidates in swivel order with a minimum's refinement after its
   * step, so the first of equals is the full sweep's wherever the arcs cover
   * its candidates.
   *
   * @param props The arcs, the scorer, the order, the refinement and the optional bound.
   * @returns The chosen candidate; null when no arc is given.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the candidates, the minimum rule, why refinement probes are held, the ends, the full turn, the fold's order and the null case.
   * @evidence contracts/development/implementation.md#principled-implementation The exhaustive step sweep with golden-section refinement of each local minimum (Kiefer 1953) restricted to closed-form arcs; with a bound, branch and bound: an arc whose certified bound exceeds a read key holds only candidates strictly behind that one, so leaving it out of a first-of-equals fold changes nothing. Its premise is the caller's: every candidate that can be chosen lies on an arc.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The visit order, one arc's candidates and minima, then the ordered fold.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The step and the refinement are the articulation's; no candidate is assumed, and a bound that cannot decide visits the arc.
   * @evidence contracts/development/implementation.md#efficient-algorithms One score a grid step inside the visited arcs, two an arc for its ends and one refinement a local minimum; one bound read and one sort entry an arc. Driven by the arcs' total width in steps, against 360 a branch for the full sweep. Unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work A minimum's step and neighbours are the candidates already scored for the fold; nothing crosses calls.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One candidate list an arc lives until return; only the chosen candidate escapes.
   */
  export function least<T>(props: IProps<T>): T | null {
    // The visit: every arc in the order given, or by ascending bound until
    // an arc's bound exceeds the least key read.
    const order: number[] = props.arcs.map(
      (_: IAutoMovieSwivelArcs.IArc, index: number): number => index,
    );
    const floors: number[] | null =
      props.bounded === undefined
        ? null
        : props.arcs.map((arc: IAutoMovieSwivelArcs.IArc): number =>
            props.bounded!.below(arc.from, arc.to),
          );
    if (floors !== null)
      order.sort(
        (a: number, b: number): number => floors[a]! - floors[b]! || a - b,
      );
    let least: number = Infinity;
    const note = (candidate: T): void => {
      const key: number | null | undefined = props.bounded?.key(candidate);
      if (key !== null && key !== undefined) least = Math.min(least, key);
    };
    const visited: Map<number, T[]> = new Map();
    for (const index of order) {
      if (floors !== null && floors[index]! > least) break;
      const found: T[] = over(props, props.arcs[index]!);
      found.forEach(note);
      visited.set(index, found);
    }

    // The fold, in the arcs' own order.
    let chosen: T | null = null;
    for (let index: number = 0; index < props.arcs.length; ++index)
      for (const candidate of visited.get(index) ?? [])
        if (chosen === null || props.better(candidate, chosen))
          chosen = candidate;
    return chosen;
  }

  /** One arc's candidates in fold order: each scored swivel, a local minimum's refinement after its step. */
  function over<T>(props: IProps<T>, arc: IAutoMovieSwivelArcs.IArc): T[] {
    const whole: boolean = arc.to - arc.from >= 360;

    // The swivels scored: the circle's steps, or the arc's start, the grid
    // steps inside it and its end.
    const swivels: number[] = [];
    if (whole) for (let step: number = 0; step * STEP < 360; ++step) swivels.push(step * STEP);
    else {
      const first: number = Math.ceil(arc.from / STEP);
      const last: number = Math.floor(arc.to / STEP);
      if (first > last || first * STEP !== arc.from) swivels.push(arc.from);
      for (let step: number = first; step <= last; ++step) swivels.push(step * STEP);
      if (arc.to !== swivels[swivels.length - 1]) swivels.push(arc.to);
    }
    const scored: T[] = swivels.map(props.probe);

    // A refinement's probes stay on the arc.
    const held = (swivel: number): T =>
      props.probe(Math.min(arc.to, Math.max(arc.from, swivel)));
    const found: T[] = [];
    for (let i: number = 0; i < scored.length; ++i) {
      const at: T = scored[i]!;
      found.push(at);
      const before: T | undefined = whole
        ? scored[(i + scored.length - 1) % scored.length]
        : scored[i - 1];
      const after: T | undefined = whole
        ? scored[(i + 1) % scored.length]
        : scored[i + 1];
      if (before === undefined || after === undefined) continue;
      if (props.better(before, at) || props.better(after, at)) continue;
      if (!props.better(at, before) && !props.better(at, after)) continue;
      found.push(props.refine(whole ? props.probe : held, swivels[i]!));
    }
    return found;
  }
}
