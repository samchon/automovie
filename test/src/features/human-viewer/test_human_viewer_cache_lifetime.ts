import { TestValidator } from "@nestia/e2e";

import { createHumanViewerCache } from "../../../scripts/human-viewer/createHumanViewerCache";

/**
 * Replacements and teardown preserve resource ownership.
 * Scenarios:
 * 1. Replacing by the same value retains it; replacing by another releases the old owner.
 * 2. Clearing releases residents once, and invalid capacities refuse before allocation.
 */
export function test_human_viewer_cache_lifetime(): void {
  const released: number[] = [];
  const cache = createHumanViewerCache<number>(1, (value) => {
    released.push(value);
  });
  cache.set("a", 1);
  cache.set("a", 1);
  cache.set("a", 2);
  TestValidator.equals("replace", released, [1]);
  cache.clear();
  cache.clear();
  TestValidator.equals("clear", released, [1, 2]);
  TestValidator.equals("empty", cache.keys(), []);
  for (const capacity of [0, -1, 1.5, NaN, Infinity]) {
    let refused = false;
    try {
      createHumanViewerCache(capacity, () => {});
    } catch {
      refused = true;
    }
    TestValidator.predicate("invalid capacity", refused);
  }
}
