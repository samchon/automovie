import { TestValidator } from "@nestia/e2e";

import { planHumanViewerThumbnailRevision } from "../../../scripts/human-viewer/planHumanViewerThumbnailRevision";

/**
 * A response cannot acquire the source identity of a newer gallery request.
 *
 * Scenarios:
 * 1. Matching, current response provenance admits caching.
 * 2. A source-stale response, a different generation, or absent provenance
 *    remains stale and refuses caching without changing its actual revision.
 */
export const test_human_viewer_thumbnail_revision = (): void => {
  TestValidator.equals("current response", planHumanViewerThumbnailRevision("new", "new", false),
    { revision: "new", stale: false, cache: true });
  TestValidator.equals("source stale", planHumanViewerThumbnailRevision("new", "new", true),
    { revision: "new", stale: true, cache: false });
  TestValidator.equals("old generation", planHumanViewerThumbnailRevision("new", "old", false),
    { revision: "old", stale: true, cache: false });
  TestValidator.equals("missing provenance", planHumanViewerThumbnailRevision("new", null, false),
    { revision: null, stale: true, cache: false });
};
