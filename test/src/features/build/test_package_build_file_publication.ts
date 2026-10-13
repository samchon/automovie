import { TestValidator } from "@nestia/e2e";

import type { IHumanBuildFileHost } from "../../../../packages/human/build/IHumanBuildFileHost";
import { synchronizeHumanBuild } from "../../../../packages/human/build/synchronizeHumanBuild";

/**
 * Complete staged files replace changed bytes before obsolete membership is
 * removed. Typed file effects exercise the production ordering and errors;
 * no filesystem or compiler is reproduced.
 *
 * Scenarios:
 * 1. First, identical, changed and removed inventories select independent effects.
 * 2. Replacement failure stops obsolete removal and preserves original failure identity.
 * 3. Removal and inventory failures propagate; absent-source rollback clears membership.
 */
export function test_package_build_file_publication(): void {
  const old = [{ file: "same.js", digest: "equal" }, { file: "changed.js", digest: "old" }, { file: "obsolete.js", digest: "unused" }];
  const next = [{ file: "same.js", digest: "equal" }, { file: "changed.js", digest: "new" }, { file: "added.js", digest: "addition" }];
  for (const scenario of [
    { previous: [], next, source: "staged", expected: ["write:same.js", "write:changed.js", "write:added.js"], fail: "" },
    { previous: old, next: old, source: "staged", expected: [], fail: "" },
    { previous: old, next, source: "staged", expected: ["write:changed.js", "write:added.js", "remove:obsolete.js"], fail: "" },
    { previous: old, next, source: "staged", expected: ["write:changed.js"], fail: "write:changed.js" },
    { previous: old, next, source: "staged", expected: ["write:changed.js", "write:added.js", "remove:obsolete.js"], fail: "remove:obsolete.js" },
    { previous: old, next: [], source: undefined, expected: ["remove:same.js", "remove:changed.js", "remove:obsolete.js"], fail: "" },
    { previous: old, next, source: "staged", expected: [], fail: "inventory" },
  ]) {
    const observed: string[] = [];
    const failure = new Error(scenario.fail);
    const perform = (effect: string): void => {
      observed.push(effect);
      if (effect === scenario.fail) throw failure;
    };
    const host: IHumanBuildFileHost = {
      files: (directory) => {
        if (scenario.fail === "inventory") throw failure;
        return directory === "published" ? scenario.previous : scenario.next;
      },
      replace: (source, output, file) => {
        TestValidator.equals("staged byte authority", source, "staged");
        TestValidator.equals("stable output root", output, "published");
        perform("write:" + file);
      },
      remove: (output, file) => {
        TestValidator.equals("obsolete membership owner", output, "published");
        perform("remove:" + file);
      },
    };
    let caught: unknown;
    try { synchronizeHumanBuild(host, scenario.source, "published"); } catch (error) { caught = error; }
    TestValidator.equals("file effect order", observed, scenario.expected);
    TestValidator.predicate("original effect failure", scenario.fail ? caught === failure : caught === undefined);
  }
}
