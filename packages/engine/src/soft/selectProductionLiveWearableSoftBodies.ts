import { IAutoMovieSoftBodyDomain } from "@automovie/interface";

import { productionSoftBodyUsesMovingBoundary } from "./productionSoftBodyUsesMovingBoundary";
import { readProductionLiveWearableSoftBodies } from "./readProductionLiveWearableSoftBodies";

/** Resolve a shot's share of the authored production-wide live-soft order. Absent selected domains contribute nothing; present static selections and unselected moving domains throw. No production/viewer caller currently installs this live-selection API.
 *
 * @evidence contracts/common.md#principled-implementation The canonical unknown-list admission feeds id-keyed shot-domain matching, preserving authored subjectIndex and total maxSubjects. Typed domain fields remain a premise and empty selections are valid only for static shot domains.
 * @evidence contracts/common.md#clear-and-simple-design Production-wide budget identity is kept separate from shot-local availability; the shared declaration predicate distinguishes static and moving domains on both admission paths.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing shot-local domains are the explicit production-list rule rather than a fabricated subject, and incompatible present domains are refused instead of silently skipped.
 * @evidence contracts/common.md#meaningful-documentation States list-versus-shot scope, preserved slots, failure cases and unwired host reach.
 * @evidence contracts/performance.md#efficient-algorithms For N selected ids and D shot domains with A anchors/C colliders, expected work is O(N+D+A+C), with O(N+D) lookup/result storage.
 * @evidence contracts/performance.md#reuse-equivalent-work One admitted order, selected-id Set and available-domain Map serve both compatibility checks and output selection; mutable shot records are not cached across builds.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Lookup collections are temporary; returned rows retain the caller-owned domain references and budget scalars until their consuming solve releases them.
 */
export const selectProductionLiveWearableSoftBodies: <
  Domain extends Pick<IAutoMovieSoftBodyDomain, "id" | "anchors" | "colliders">,
>(
  domains: readonly Domain[],
  selected: unknown,
) => { domain: Domain; subjectIndex: number; maxSubjects: number }[] = <
  Domain extends Pick<IAutoMovieSoftBodyDomain, "id" | "anchors" | "colliders">,
>(
  domains: readonly Domain[],
  selected: unknown,
): Array<{ domain: Domain; subjectIndex: number; maxSubjects: number }> => {
  const ordered: string[] = readProductionLiveWearableSoftBodies(selected);
  const selectedSet: Set<string> = new Set(ordered);
  const available: Map<string, Domain> = new Map<string, Domain>();
  for (const domain of domains) {
    if (
      domain.id.trim().length === 0 ||
      domain.id !== domain.id.trim() ||
      available.has(domain.id)
    )
      throw new Error(
        "Compiled soft-body domain ids must be non-blank, trimmed, and unique.",
      );
    available.set(domain.id, domain);
    if (
      productionSoftBodyUsesMovingBoundary(domain) &&
      selectedSet.has(domain.id) === false
    )
      throw new Error(
        `Live wearable soft body "${domain.id}" declares a moving boundary but simulation.liveWearableSoftBodies does not select it.`,
      );
  }
  return ordered.flatMap(
    (
      id: string,
      subjectIndex: number,
    ): { domain: Domain; subjectIndex: number; maxSubjects: number }[] => {
      const domain: Domain | undefined = available.get(id);
      if (domain === undefined) return [];
      if (productionSoftBodyUsesMovingBoundary(domain) === false)
        throw new Error(
          `Live wearable soft body "${id}" is selected for a live solve but declares no moving boundary.`,
        );
      return [{ domain, subjectIndex, maxSubjects: ordered.length }];
    },
  );
};
