import { TestValidator } from "@nestia/e2e";

import { admitHumanViewerCatalogue } from "../../../scripts/human-viewer/admitHumanViewerCatalogue";
import type { HumanViewerCatalogue } from "../../../scripts/human-viewer/HumanViewerCatalogue";
import { throwsError } from "../internal/predicates";

/**
 * Local document rescans never relabel a resident worker as a newer generation.
 *
 * Scenarios:
 * 1. An inventory under the loaded revision may replace its document population.
 * 2. A changed source revision refuses and leaves the current catalogue intact.
 */
export const test_human_viewer_catalogue_generation = (): void => {
  const current: HumanViewerCatalogue = { revision: "loaded", documents: [], rejected: [] };
  const same: HumanViewerCatalogue = { revision: "loaded", documents: [],
    rejected: [{ file: "new-input.json", reason: "invalid document" }] };
  TestValidator.predicate("same generation keeps refreshed inventory",
    admitHumanViewerCatalogue(current, same) === same);
  const next: HumanViewerCatalogue = { revision: "new-source", documents: [], rejected: [] };
  TestValidator.predicate("new source needs a new page", throwsError(
    () => admitHumanViewerCatalogue(current, next), "newer source generation"));
  TestValidator.equals("current revision preserved", current.revision, "loaded");
  TestValidator.equals("current inventory preserved", current.rejected, []);
};
