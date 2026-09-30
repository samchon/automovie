import { TestValidator } from "@nestia/e2e";
import { createHumanViewerCompilation } from "../../../scripts/human-viewer/createHumanViewerCompilation";

/**
 * All transformed modules in one generation share one complete compiler result.
 * Scenarios:
 * 1. Multiple module lookups and a missing module compile once.
 * 2. Invalidation recompiles and a failed generation cannot serve its predecessor.
 * 3. Repair after failure can compile and publish a fresh generation.
 */
export function test_human_viewer_compilation_generation(): void {
  let count = 0;
  let fail = false;
  const owner = createHumanViewerCompilation(() => {
    ++count;
    if (fail) throw new Error("broken source");
    return { a: String(count), b: "other" };
  });
  TestValidator.equals("first", owner.source("a"), "1");
  TestValidator.equals("same generation", owner.source("b"), "other");
  TestValidator.equals("missing", owner.source("absent"), undefined);
  TestValidator.equals("one compile", count, 1);
  owner.invalidate();
  TestValidator.equals("new generation", owner.source("a"), "2");
  owner.invalidate(); fail = true;
  let refused = false;
  try { owner.source("a"); } catch { refused = true; }
  TestValidator.predicate("failure refuses", refused);
  fail = false;
  TestValidator.equals("repaired", owner.source("a"), "4");
}
