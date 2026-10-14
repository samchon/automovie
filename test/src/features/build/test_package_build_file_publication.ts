import { TestValidator } from "@nestia/e2e";

import type { IHumanBuildFileHost } from "../../../../packages/human/build/IHumanBuildFileHost";
import { synchronizeHumanBuild } from "../../../../packages/human/build/synchronizeHumanBuild";

/**
 * Complete staged files replace changed bytes before obsolete membership is removed. Typed file effects observe the real synchronization function's ordering and failure paths without reproducing a filesystem or compiler.
 *
 * Scenarios:
 * 1. First, identical, changed and removed inventories select independent effects.
 * 2. Replacement failure stops obsolete removal and preserves original failure identity.
 * 3. Removal and inventory failures propagate; absent-source rollback clears membership.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls synchronizeHumanBuild through its existing typed file-effect port and observes requested replacement/removal order, source/output authority and original failure identity, catching obsolete deletion before replacement or writes for unchanged digests.
 * @evidence contracts/testing.md#independent-expectations Literal previous/next memberships and equal versus changed digest labels independently determine the required effect sequence; the supplied failure object must escape unchanged. Digests model input identity and do not prove byte hashing, filesystem atomicity or platform sharing behavior.
 * @evidence contracts/testing.md#distinguishing-cases Retains first, unchanged, changed/added/obsolete and absent-source inventories, plus replacement, removal and inventory failures. The companion replacement/publication entries own reservation lifetime and package-level rollback.
 * @evidence contracts/testing.md#execution-ownership The synchronous discoverable test_package_build_file_publication entry owns the seven table rows and their typed effects; it invokes the actual portable orchestration function without installing a consumer, building an artifact or starting a filesystem/compiler/browser/GPU host.
 */
export function test_package_build_file_publication(): void {
  const old: { file: string; digest: string }[] = [
    { file: "same.js", digest: "equal" },
    { file: "changed.js", digest: "old" },
    { file: "obsolete.js", digest: "unused" },
  ];
  const next: { file: string; digest: string }[] = [
    { file: "same.js", digest: "equal" },
    { file: "changed.js", digest: "new" },
    { file: "added.js", digest: "addition" },
  ];
  for (const scenario of [
    {
      previous: [],
      next,
      source: "staged",
      expected: ["write:same.js", "write:changed.js", "write:added.js"],
      fail: "",
    },
    { previous: old, next: old, source: "staged", expected: [], fail: "" },
    {
      previous: old,
      next,
      source: "staged",
      expected: ["write:changed.js", "write:added.js", "remove:obsolete.js"],
      fail: "",
    },
    {
      previous: old,
      next,
      source: "staged",
      expected: ["write:changed.js"],
      fail: "write:changed.js",
    },
    {
      previous: old,
      next,
      source: "staged",
      expected: ["write:changed.js", "write:added.js", "remove:obsolete.js"],
      fail: "remove:obsolete.js",
    },
    {
      previous: old,
      next: [],
      source: undefined,
      expected: ["remove:same.js", "remove:changed.js", "remove:obsolete.js"],
      fail: "",
    },
    { previous: old, next, source: "staged", expected: [], fail: "inventory" },
  ]) {
    const observed: string[] = [];
    const failure: Error = new Error(scenario.fail);
    const perform: (effect: string) => void = (effect: string): void => {
      observed.push(effect);
      if (effect === scenario.fail) throw failure;
    };
    const host: IHumanBuildFileHost = {
      files: (directory: string): { file: string; digest: string }[] => {
        if (scenario.fail === "inventory") throw failure;
        return directory === "published" ? scenario.previous : scenario.next;
      },
      replace: (source: string, output: string, file: string): void => {
        TestValidator.equals("staged byte authority", source, "staged");
        TestValidator.equals("stable output root", output, "published");
        perform("write:" + file);
      },
      remove: (output: string, file: string): void => {
        TestValidator.equals("obsolete membership owner", output, "published");
        perform("remove:" + file);
      },
    };
    let caught: unknown;
    try {
      synchronizeHumanBuild(host, scenario.source, "published");
    } catch (error) {
      caught = error;
    }
    TestValidator.equals("file effect order", observed, scenario.expected);
    TestValidator.predicate(
      "original effect failure",
      scenario.fail ? caught === failure : caught === undefined,
    );
  }
}
