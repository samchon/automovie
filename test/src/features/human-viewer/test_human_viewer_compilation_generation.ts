import { TestValidator } from "@nestia/e2e";

import { createHumanViewerCompilation, type IHumanViewerCompilationStatus } from "../../../scripts/human-viewer/createHumanViewerCompilation";
import { rejectsWith } from "../internal/rejectsWith";

/**
 * All transformed modules in one generation share one complete compiler result,
 * and a broken working tree never takes the viewer down.
 * Scenarios:
 * 1. Multiple module lookups, concurrent ones and a missing module compile once.
 * 2. Invalidation recompiles, including when it arrives during a compile.
 * 3. A failed compile keeps serving the last generation that compiled and
 *    reports the error with that generation's time; the next lookup tries
 *    again, and a successful compile replaces the generation and clears the
 *    report.
 * 4. A failure before any generation has compiled has nothing to fall back to
 *    and is thrown.
 */
export async function test_human_viewer_compilation_generation(): Promise<void> {
  let count = 0;
  let fail = false;
  const reports: IHumanViewerCompilationStatus[] = [];
  const owner = createHumanViewerCompilation(
    async () => {
      ++count;
      await Promise.resolve();
      if (fail) throw new Error("broken source");
      return { a: String(count), b: "other" };
    },
    (status) => reports.push(status),
    () => "at-" + count,
  );
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
  TestValidator.equals("last good served", await owner.source("a"), "3");
  TestValidator.equals("error reported", reports[reports.length - 1], { error: "broken source", goodAt: "at-3" });
  owner.invalidate();
  TestValidator.equals("still last good", await owner.source("b"), "other");
  fail = false;
  owner.invalidate();
  TestValidator.equals("repaired", await owner.source("a"), "6");
  TestValidator.equals("report cleared", reports[reports.length - 1], { error: null, goodAt: "at-6" });
  const cold = createHumanViewerCompilation(() => Promise.reject(new Error("no generation")));
  TestValidator.predicate("nothing to fall back to", await rejectsWith(() => cold.source("a"), "no generation"));
}
