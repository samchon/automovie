import { IAutoMovieDesignLineage } from "@automovie/interface";

import { compareCodeUnits } from "../text/compareCodeUnits";
import { requireValidDesignLineage } from "./requireValidDesignLineage";

/**
 * Order the construction plan deterministically.
 *
 * The plan is a graph, so many orders satisfy it and the authoring order is not one of them: reordering a source array must not reorder a schedule. Of the phases whose prerequisites are all emitted, the one with the lowest id in code-unit order is taken next, which makes the answer a function of the plan alone.
 *
 * Returns every phase id once, each after all of its `requires`. An invalid lineage, including a cyclic plan or a prerequisite naming no phase, throws an `Error` before ordering.
 *
 * @param lineage Lineage whose phases are ordered.
 * @returns Every phase id, prerequisites first, ties broken by lowest id.
 *
 * @evidence contracts/common.md#principled-implementation Kahn's topological sort with the ready set kept in code-unit order, so each step takes the lowest-id phase whose prerequisites are emitted, which is the unique lexicographically smallest topological order; validation guarantees the graph is acyclic and every prerequisite resolves, so every phase is emitted.
 * @evidence contracts/common.md#clear-and-simple-design One in-degree table, one dependents index and one ordered ready list, behind the validation guard shared by every lineage query.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no phase; ties are broken by id for every plan, and an invalid plan is refused rather than partly ordered.
 * @evidence contracts/common.md#meaningful-documentation States why authoring order is ignored, the exact tie rule, that every phase appears once after its prerequisites, and the thrown refusal.
 * @evidence contracts/performance.md#efficient-algorithms Pays full lineage validation first, including per-lifecycle prerequisite reachability and decision-by-artifact fairness scans. Ordering itself is O(R + P²) for P phases and R prerequisite edges: initial sorting is O(P log P), every edge is relaxed once, and ready-list insertion and removal can shift O(P) entries each.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Orders the plan it is handed each call; nothing is cached because the caller may change the lineage between calls.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The indices and ready list live only for the call and are linear in the plan size; the caller owns the returned order.
 */
export const designLineagePhaseOrder: (lineage: IAutoMovieDesignLineage) => string[] = (
  lineage: IAutoMovieDesignLineage,
): string[] => {
  requireValidDesignLineage(lineage);
  const waiting: Map<string, number> = new Map();
  const dependents: Map<string, string[]> = new Map();
  const ready: string[] = [];
  for (const phase of lineage.phases) {
    waiting.set(phase.id, phase.requires.length);
    if (phase.requires.length === 0) ready.push(phase.id);
    for (const required of phase.requires) {
      const list: string[] | undefined = dependents.get(required);
      if (list === undefined) dependents.set(required, [phase.id]);
      else list.push(phase.id);
    }
  }
  ready.sort(compareCodeUnits);
  const order: string[] = [];
  while (ready.length !== 0) {
    const next: string = ready.shift()!;
    order.push(next);
    for (const dependent of dependents.get(next) ?? []) {
      const remaining: number = waiting.get(dependent)! - 1;
      waiting.set(dependent, remaining);
      if (remaining === 0) insertSorted(ready, dependent);
    }
  }
  return order;
};

/** Insert one id into a code-unit-sorted list, keeping it sorted. */
const insertSorted: (sorted: string[], id: string) => void = (sorted: string[], id: string): void => {
  let low: number = 0;
  let high: number = sorted.length;
  while (low < high) {
    const middle: number = (low + high) >>> 1;
    if (compareCodeUnits(sorted[middle]!, id) < 0) low = middle + 1;
    else high = middle;
  }
  sorted.splice(low, 0, id);
};
