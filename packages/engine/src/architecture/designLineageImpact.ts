import {
  IAutoMovieDesignImpact,
  IAutoMovieDesignLineage,
} from "@automovie/interface";

import { compareCodeUnits } from "../text/compareCodeUnits";
import { validateDesignLineage } from "./validateDesignLineage";

/**
 * Name exactly the derived artifacts a set of changed identities invalidates.
 *
 * Impact walks the declared derivation edges backwards, so changing one opening
 * reaches the wall mesh cut around it, the finish pieces cut to that wall, the
 * door leaf hosted in it, the schedule line counting them, and the render that
 * drew them, and reaches nothing else. The untouched artifacts are returned
 * beside the invalidated ones because "only these" is a claim about the
 * complement, and a report naming one side alone cannot be checked.
 *
 * A changed derived artifact counts as invalidated itself. All three lists are
 * deduplicated and sorted by code unit. An invalid lineage, or a changed id
 * that is neither a declared subject nor a derived artifact, throws an
 * `Error`.
 *
 * @param lineage Lineage whose `derived` inputs define the edges.
 * @param changed Subject or derived-artifact ids that changed.
 * @returns The changed ids, the derived artifacts they reach, and every other derived artifact.
 * @evidence contracts/common.md#principled-implementation Inverts the declared `inputs` into a dependents index and runs a breadth-first reachability walk from the changed ids with a visited set; validation guarantees the derivation graph is acyclic, though the visited set would also stop a cycle.
 * @evidence contracts/common.md#clear-and-simple-design Builds the reverse index locally from `derived` instead of storing reverse edges on the record, so the lineage keeps one direction of truth; the `requireValidLineage` helper is a verbatim copy shared with sibling lineage files.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An unknown changed id is refused rather than ignored, and no artifact kind is special-cased; reachability follows declared inputs only, so an input the author forgot to declare is invisible to impact.
 * @evidence contracts/common.md#meaningful-documentation Gives the walk direction, the complement returned beside the invalidated set, sorting and deduplication, that a changed artifact invalidates itself, and the refusals.
 * @evidence contracts/performance.md#cost-and-resources Meant to be O(V + E) over identities and declared input edges after one full validation, but `queue.shift()` costs O(queue) per pop and the dependents index grows by array spread per input, so a large fan-in is quadratic, both needless; no index is cached across change sets and all of them are released on return.
 */
export const designLineageImpact = (
  lineage: IAutoMovieDesignLineage,
  changed: readonly string[],
): IAutoMovieDesignImpact => {
  requireValidLineage(lineage);
  const known = new Set([
    ...lineage.subjects.map((subject) => subject.id),
    ...lineage.derived.map((artifact) => artifact.id),
  ]);
  for (const id of changed)
    if (!known.has(id))
      throw new Error(
        `design lineage "${lineage.id}" has no identity "${id}" to trace`,
      );
  const dependents = new Map<string, string[]>();
  for (const artifact of lineage.derived)
    for (const input of artifact.inputs)
      dependents.set(input, [...(dependents.get(input) ?? []), artifact.id]);
  const derivedIds = new Set(lineage.derived.map((artifact) => artifact.id));
  const invalidated = new Set<string>();
  const visited = new Set<string>();
  const queue = [...changed];
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);
    if (derivedIds.has(current)) invalidated.add(current);
    for (const dependent of dependents.get(current) ?? [])
      queue.push(dependent);
  }
  return {
    changed: [...new Set(changed)].sort(compareCodeUnits),
    invalidated: [...invalidated].sort(compareCodeUnits),
    unaffected: [...derivedIds]
      .filter((id) => !invalidated.has(id))
      .sort(compareCodeUnits),
  };
};

const requireValidLineage = (lineage: IAutoMovieDesignLineage): void => {
  const validated = validateDesignLineage({ lineage });
  if (validated.success === false) {
    const first = validated.violations[0]!;
    throw new Error(
      `design lineage "${lineage.id}" is invalid at ${first.path}: ${first.expected}`,
    );
  }
};
