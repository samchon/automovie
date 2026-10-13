import { TestValidator } from "@nestia/e2e";
import path from "node:path";

import type { IHumanBuildFileHost } from "../../../../packages/human/build/IHumanBuildFileHost";
import type { synchronizeHumanBuild as Synchronize } from "../../../../packages/human/build/synchronizeHumanBuild.mjs";
import { loadSourceModule } from "../internal/loadSourceModule";

/**
 *
 * Complete staged files replace changed bytes before obsolete membership is
 * removed. Typed file effects exercise the production ordering and errors;
 * no filesystem or compiler is reproduced.
 *
 * Scenarios:
 * 1. First, identical, changed and removed inventories select independent effects.
 * 2. Replacement failure stops obsolete removal and preserves original failure identity.
 * 3. Removal and inventory failures propagate; absent-source rollback clears membership.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls `synchronizeHumanBuild` through an `IHumanBuildFileHost` that records each `replace` and `remove`, and asserts the recorded effect list, the `staged` and `published` roots each effect receives, and the identity of the thrown error; it catches rewriting a file whose digest is unchanged, removing an obsolete file before a replacement has completed, continuing past a failed write, swallowing an inventory or removal error, and an undefined source that leaves old members behind.
 * @evidence contracts/testing.md#independent-expectations Each expected effect list is derived from the module's stated rules (equal digests need no write, replacements precede obsolete removal, an undefined source means empty membership) applied by hand to the three-file inventories; the error must be the same `Error` object the fake threw. Limitation: writes are expected in staged-inventory order, which the contract does not promise, and digests are opaque labels, so real byte hashing is not checked.
 * @evidence contracts/testing.md#distinguishing-cases Owns seven inventory pairs: empty previous (all three written), identical (no effect), one equal, one changed, one added and one obsolete (two writes then one removal), failure on the first write (later write and removal skipped), failure on the removal, absent source (three removals), and a failing inventory read (no effect); single-file replacement and its sibling cleanup belong to test_package_build_file_replacement.
 */
export function test_package_build_file_publication(): void {
  const synchronize = loadSourceModule<{ synchronizeHumanBuild: typeof Synchronize }>(
    path.resolve(__dirname, "../../../../packages/human/build/synchronizeHumanBuild.mjs"),
  ).synchronizeHumanBuild;
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
    try { synchronize(host, scenario.source, "published"); } catch (error) { caught = error; }
    TestValidator.equals("file effect order", observed, scenario.expected);
    TestValidator.predicate("original effect failure", scenario.fail ? caught === failure : caught === undefined);
  }
}
