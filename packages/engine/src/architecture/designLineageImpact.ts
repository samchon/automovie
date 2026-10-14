import {
  IAutoMovieDerivedArtifact,
  IAutoMovieDesignImpact,
  IAutoMovieDesignLineage,
  IAutoMovieDesignSubject,
} from "@automovie/interface";

import { compareCodeUnits } from "../text/compareCodeUnits";
import { requireValidDesignLineage } from "./requireValidDesignLineage";

/**
 * Name exactly the derived artifacts a set of changed identities invalidates.
 *
 * Impact walks the declared derivation edges backwards, so changing one opening reaches the wall mesh cut around it, the finish pieces cut to that wall, the door leaf hosted in it, the schedule line counting them, and the render that drew them, and reaches nothing else. The untouched artifacts are returned beside the invalidated ones because "only these" is a claim about the complement, and a report naming one side alone cannot be checked.
 *
 * A changed derived artifact counts as invalidated itself. All three lists are deduplicated and sorted by code unit. An invalid lineage, or a changed id that is neither a declared subject nor a derived artifact, throws an `Error`.
 *
 * @param lineage Lineage whose `derived` inputs define the edges.
 * @param changed Subject or derived-artifact ids that changed.
 * @returns The changed ids, the derived artifacts they reach, and every other derived artifact.
 *
 * @evidence contracts/common.md#principled-implementation Breadth-first reachability from the changed ids over the reversed `inputs` edges, visiting each identity once, so the invalidated set is exactly the derived artifacts with a dependency path to a change; validation guarantees every edge endpoint is declared.
 * @evidence contracts/common.md#clear-and-simple-design One dependents index and one walk, with the validation guard shared by every lineage query, so the answer and its complement come from the same traversal.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no identity or artifact kind; an undeclared changed id is refused rather than silently ignored, because a typo would otherwise report nothing invalidated.
 * @evidence contracts/common.md#meaningful-documentation States the backward walk and an example chain, why the complement is returned, that a changed artifact counts itself, the dedup and order of all three lists, and every refusal.
 * @evidence contracts/performance.md#efficient-algorithms Pays full lineage validation, including lifecycle prerequisite walks and decision-by-artifact fairness scans, then O(I + R + C) indexing and traversal for identities I, derivation edges R and changed inputs C. The three deduplicated output lists add their sorting costs; queue reads use an index rather than shifting.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Answers one change set per call from the caller's mutable record; the index is rebuilt each call because a cached one could not prove the lineage unchanged.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The index, queue and visited set live only for the call and are linear in the lineage size; the caller owns the returned lists.
 */
export const designLineageImpact: (lineage: IAutoMovieDesignLineage, changed: readonly string[]) => IAutoMovieDesignImpact = (
  lineage: IAutoMovieDesignLineage,
  changed: readonly string[],
): IAutoMovieDesignImpact => {
  requireValidDesignLineage(lineage);
  const derivedIds: Set<string> = new Set(
    lineage.derived.map(
      (artifact: IAutoMovieDerivedArtifact): string => artifact.id,
    ),
  );
  const known: Set<string> = new Set([
    ...lineage.subjects.map(
      (subject: IAutoMovieDesignSubject): string => subject.id,
    ),
    ...derivedIds,
  ]);
  for (const id of changed)
    if (!known.has(id))
      throw new Error(
        `design lineage "${lineage.id}" has no identity "${id}" to trace`,
      );
  const dependents: Map<string, string[]> = new Map();
  for (const artifact of lineage.derived)
    for (const input of artifact.inputs) {
      const list: string[] | undefined = dependents.get(input);
      if (list === undefined) dependents.set(input, [artifact.id]);
      else list.push(artifact.id);
    }
  const visited: Set<string> = new Set(changed);
  const queue: string[] = [...visited];
  for (let index: number = 0; index < queue.length; ++index)
    for (const dependent of dependents.get(queue[index]!) ?? [])
      if (!visited.has(dependent)) {
        visited.add(dependent);
        queue.push(dependent);
      }
  const invalidated: string[] = queue
    .filter((id: string): boolean => derivedIds.has(id))
    .sort(compareCodeUnits);
  return {
    changed: [...new Set(changed)].sort(compareCodeUnits),
    invalidated,
    unaffected: [...derivedIds]
      .filter((id: string): boolean => !visited.has(id))
      .sort(compareCodeUnits),
  };
};
