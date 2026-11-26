import { IAutoMovieSoftBodyDomain } from "@automovie/interface";

import { productionSoftBodyUsesMovingBoundary } from "./internal/productionSoftBodyUsesMovingBoundary";
import { readProductionLiveWearableSoftBodies } from "./internal/readProductionLiveWearableSoftBodies";

/**
 * Resolve a shot's share of the authored production-wide live-soft order.
 * Absent selected domains contribute nothing; present static selections and
 * unselected moving domains throw. No production/viewer caller currently
 * installs this live-selection API.
 */
export const selectProductionLiveWearableSoftBodies: <
  Domain extends Pick<IAutoMovieSoftBodyDomain, "id" | "anchors" | "colliders">,
>(
  domains: readonly Domain[],
  selected: readonly string[],
) => { domain: Domain; subjectIndex: number; maxSubjects: number }[] = <
  Domain extends Pick<IAutoMovieSoftBodyDomain, "id" | "anchors" | "colliders">,
>(
  domains: readonly Domain[],
  selected: readonly string[],
): Array<{ domain: Domain; subjectIndex: number; maxSubjects: number }> => {
  const ordered: string[] = readProductionLiveWearableSoftBodies(selected);
  const selectedSet: Set<string> = new Set(ordered);
  const available: Map<string, Domain> = new Map<string, Domain>();
  for (const domain of domains) {
    if (available.has(domain.id))
      throw new Error("Compiled soft-body domain ids must be unique.");
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
