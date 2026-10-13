import { IAutoMovieSoftBodyDomain } from "@automovie/interface";

import { productionSoftBodyUsesMovingBoundary } from "./productionSoftBodyUsesMovingBoundary";
import { readProductionLiveWearableSoftBodies } from "./readProductionLiveWearableSoftBodies";

/**
 * Resolve one shot's exact share of the production-wide live-soft selection.
 *
 * A selected id absent from this shot simply contributes nothing, because the
 * list is a production budget. A moving-boundary domain the author did not
 * select, or a selected domain with no moving boundary, is refused instead of
 * being silently solved or skipped. Each admitted domain keeps its authored
 * budget slot and the production-wide subject ceiling.
 */
export const selectProductionLiveWearableSoftBodies = <
  Domain extends Pick<IAutoMovieSoftBodyDomain, "id" | "anchors" | "colliders">,
>(
  domains: readonly Domain[],
  selected: unknown,
): Array<{ domain: Domain; subjectIndex: number; maxSubjects: number }> => {
  const ordered = readProductionLiveWearableSoftBodies(selected);
  const selectedSet = new Set(ordered);
  const available = new Map<string, Domain>();
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
  return ordered.flatMap((id, subjectIndex) => {
    const domain = available.get(id);
    if (domain === undefined) return [];
    if (productionSoftBodyUsesMovingBoundary(domain) === false)
      throw new Error(
        `Live wearable soft body "${id}" is selected for a live solve but declares no moving boundary.`,
      );
    return [{ domain, subjectIndex, maxSubjects: ordered.length }];
  });
};
