import {
  IAutoMovieDerivedArtifact,
  IAutoMovieDesignImpact,
  IAutoMovieDesignLineage,
  IAutoMovieDesignSubject,
} from "@automovie/interface";

import { AutoMovieEngineText } from "../../text/AutoMovieEngineText";
import { requireValidDesignLineage } from "./requireValidDesignLineage";

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
 * @returns The changed ids, the derived artifacts they reach, and every other
 *   derived artifact.
 */
export function designLineageImpact(
  lineage: IAutoMovieDesignLineage,
  changed: readonly string[],
): IAutoMovieDesignImpact {
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
    .sort(AutoMovieEngineText.compareCodeUnits);
  return {
    changed: [...new Set(changed)].sort(AutoMovieEngineText.compareCodeUnits),
    invalidated,
    unaffected: [...derivedIds]
      .filter((id: string): boolean => !visited.has(id))
      .sort(AutoMovieEngineText.compareCodeUnits),
  };
}
