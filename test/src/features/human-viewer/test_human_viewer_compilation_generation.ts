import { TestValidator } from "@nestia/e2e";

import { createHumanViewerCompilation } from "../../../scripts/human-viewer/createHumanViewerCompilation";
import { rejectsWith } from "../internal/rejectsWith";

/**
 * All transformed modules in one generation share one complete compiler result.
 * Scenarios:
 * 1. Multiple module lookups, concurrent ones and a missing module compile once.
 * 2. Invalidation recompiles, including when it arrives during a compile, and
 *    a failed generation cannot serve its predecessor.
 * 3. Repair after failure can compile and publish a fresh generation.
 */
export async function test_human_viewer_compilation_generation(): Promise<void> {
  let count = 0;
  let fail = false;
  const owner = createHumanViewerCompilation(async () => {
    ++count;
    await Promise.resolve();
    if (fail) throw new Error("broken source");
    return { a: String(count), b: "other" };
  });
  const [first, second] = await Promise.all([owner.source("a"), owner.source("b")]);
  TestValidator.equals("first", first, "1");
  TestValidator.equals("same generation", second, "other");
  TestValidator.equals("missing", await owner.source("absent"), undefined);
  TestValidator.equals("one compile", count, 1);
  owner.invalidate();
  const pending = owner.source("a");
  owner.invalidate();
  TestValidator.equals("stale caller keeps its snapshot", await pending, "2");
  TestValidator.equals("withdrawn during compile", await owner.source("a"), "3");
  owner.invalidate();
  fail = true;
  TestValidator.predicate(
    "failure refuses",
    await rejectsWith(() => owner.source("a"), "broken source"),
  );
  fail = false;
  TestValidator.equals("repaired", await owner.source("a"), "5");
}
