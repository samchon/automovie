import { TestValidator } from "@nestia/e2e";

import { createHumanViewerCache } from "../../../scripts/human-viewer/createHumanViewerCache";

/**
 * Returning to a resident changes eviction order without rebuilding it.
 * Scenarios:
 * 1. A miss leaves recency unchanged and a hit moves the owner to the newest end.
 * 2. Inserting beyond capacity releases the least-recent owner exactly once.
 */
export function test_human_viewer_cache_recency(): void {
  const released: number[] = [];
  const cache = createHumanViewerCache<number>(2, (value) => {
    released.push(value);
  });
  cache.set("first", 1);
  cache.set("second", 2);
  TestValidator.equals("miss", cache.get("absent"), undefined);
  TestValidator.equals("hit", cache.get("first"), 1);
  cache.set("third", 3);
  TestValidator.equals("order", cache.keys(), ["first", "third"]);
  TestValidator.equals("evicted", released, [2]);
}
