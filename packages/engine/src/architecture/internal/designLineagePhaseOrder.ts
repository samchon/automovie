import { IAutoMovieDesignLineage } from "@automovie/interface";

import { AutoMovieEngineText } from "../../text/AutoMovieEngineText";
import { requireValidDesignLineage } from "./requireValidDesignLineage";

/*
 * Order the construction plan deterministically.
 *
 * The plan is a graph, so many orders satisfy it and the authoring order is not
 * one of them: reordering a source array must not reorder a schedule. Of the
 * phases whose prerequisites are all emitted, the one with the lowest id in
 * code-unit order is taken next, which makes the answer a function of the plan
 * alone.
 *
 * Returns every phase id once, each after all of its `requires`. An invalid
 * lineage, including a cyclic plan or a prerequisite naming no phase, throws an
 * `Error` before ordering.
 * Parameter lineage: Lineage whose phases are ordered.
 * Returns: Every phase id, prerequisites first, ties broken by lowest id.
 */
export function designLineagePhaseOrder(
  lineage: IAutoMovieDesignLineage,
): string[] {
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
  ready.sort(AutoMovieEngineText.compareCodeUnits);
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
}

/*
 * Insert one id into a code-unit-sorted list, keeping it sorted.
 */
const insertSorted: (sorted: string[], id: string) => void = (
  sorted: string[],
  id: string,
): void => {
  let low: number = 0;
  let high: number = sorted.length;
  while (low < high) {
    const middle: number = (low + high) >>> 1;
    if (AutoMovieEngineText.compareCodeUnits(sorted[middle]!, id) < 0)
      low = middle + 1;
    else high = middle;
  }
  sorted.splice(low, 0, id);
};
