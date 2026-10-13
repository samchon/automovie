import { TestValidator } from "@nestia/e2e";
import path from "node:path";

import type { IHumanBuildHost } from "../../../../packages/human/build/IHumanBuildHost";
import type { runHumanBuild as RunHumanBuild } from "../../../../packages/human/build/runHumanBuild.mjs";
import { loadSourceModule } from "../internal/loadSourceModule";

/**
 *
 * A package build publishes both compiled variants together and preserves the
 * previous runtime until compilation succeeds. The actual owner is exercised
 * through its typed effect port without launching a compiler or simulating a
 * filesystem. Errors remain the failures of the requested build.
 *
 * Scenarios:
 * 1. First publication and replacement wait for both successful compiler passes.
 * 2. Stage creation, either compiler pass, backup and install failures stop publication.
 * 3. Failed install restores a prior runtime; failed restoration retains both errors.
 * 4. Backup disposal and stage disposal failures remain observable, including concurrent failures.
 *
 * @evidence contracts/testing.md#behavioral-verification Awaits `runHumanBuild`, which reaches `publishHumanBuild`, through an `IHumanBuildHost` that records stage creation, both compiler passes, backup, install, restore, backup removal and stage disposal; it asserts that sequence, that every effect receives the stage `createStage` returned, and the reported errors by identity, catching an install that runs after one failed pass, a backup taken when no runtime exists, a restore skipped after a failed install, a backup removed after a failed restore, and a disposal error that hides the build failure.
 * @evidence contracts/testing.md#independent-expectations The fourteen expected sequences apply the interface's stated duties by hand: install only after the `node` and `browser` passes, backup only when `hasPrevious` is true, restore after a failed install, remove the backup only after success or complete restoration, and always dispose the stage; errors are expected as the thrown objects, either alone or as `AggregateError` members in occurrence order. The fake cannot show whether a real restore returns previous bytes.
 * @evidence contracts/testing.md#distinguishing-cases Covers first and replacing publication, failure at each of stage, `node`, `browser` and backup, install failure with and without a prior runtime, install plus restore failing with and without a prior runtime, backup removal failing alone and after a failed install, stage disposal failing alone and beside a compiler failure; file-level synchronization and single-file replacement are owned by the two sibling build tests.
 */
export async function test_package_build_publication(): Promise<void> {
  const run = loadSourceModule<{ runHumanBuild: typeof RunHumanBuild }>(
    path.resolve(__dirname, "../../../../packages/human/build/runHumanBuild.mjs"),
  ).runHumanBuild;
  const scenarios: {
    previous: boolean;
    failures: string[];
    steps: string[];
    errors: string[];
  }[] = [
    { previous: false, failures: [], steps: ["stage", "node", "browser", "install", "discard"], errors: [] },
    { previous: true, failures: [], steps: ["stage", "node", "browser", "backup", "install", "remove", "discard"], errors: [] },
    { previous: true, failures: ["stage"], steps: ["stage"], errors: ["stage"] },
    { previous: true, failures: ["node"], steps: ["stage", "node", "discard"], errors: ["node"] },
    { previous: true, failures: ["browser"], steps: ["stage", "node", "browser", "discard"], errors: ["browser"] },
    { previous: true, failures: ["backup"], steps: ["stage", "node", "browser", "backup", "discard"], errors: ["backup"] },
    { previous: false, failures: ["install"], steps: ["stage", "node", "browser", "install", "restore", "discard"], errors: ["install"] },
    { previous: true, failures: ["install"], steps: ["stage", "node", "browser", "backup", "install", "restore", "remove", "discard"], errors: ["install"] },
    { previous: true, failures: ["install", "restore"], steps: ["stage", "node", "browser", "backup", "install", "restore", "discard"], errors: ["install", "restore"] },
    { previous: true, failures: ["remove"], steps: ["stage", "node", "browser", "backup", "install", "remove", "discard"], errors: ["remove"] },
    { previous: false, failures: ["discard"], steps: ["stage", "node", "browser", "install", "discard"], errors: ["discard"] },
    { previous: true, failures: ["node", "discard"], steps: ["stage", "node", "discard"], errors: ["node", "discard"] },
    { previous: true, failures: ["install", "remove"], steps: ["stage", "node", "browser", "backup", "install", "restore", "remove", "discard"], errors: ["install", "remove"] },
    { previous: false, failures: ["install", "restore"], steps: ["stage", "node", "browser", "install", "restore", "discard"], errors: ["install", "restore"] },
  ];
  for (const scenario of scenarios) {
    const observed: string[] = [];
    const effects = new Map(scenario.failures.map((name) => [name, new Error(name)]));
    const step = (name: string): void => {
      observed.push(name);
      const failure = effects.get(name);
      if (failure) throw failure;
    };
    const useStage = (stage: string, name: string): void => {
      TestValidator.equals("effects retain this build's stage", stage, "owned-output");
      step(name);
    };
    const host: IHumanBuildHost = {
      createStage: () => { step("stage"); return "owned-output"; },
      compile: async (stage, pass) => { useStage(stage, pass); },
      hasPrevious: () => scenario.previous,
      backup: (stage) => useStage(stage, "backup"),
      install: (stage) => useStage(stage, "install"),
      restore: (stage) => useStage(stage, "restore"),
      removeBackup: (stage) => useStage(stage, "remove"),
      discardStage: (stage) => useStage(stage, "discard"),
    };
    let failure: unknown;
    try { await run(host); } catch (error) { failure = error; }
    const errors = failure instanceof AggregateError ? failure.errors : failure === undefined ? [] : [failure];
    TestValidator.equals("build effect order", observed, scenario.steps);
    TestValidator.equals("reported build failure count", errors.length, scenario.errors.length);
    TestValidator.predicate(
      "original build failures survive",
      errors.every((error, index) => error === effects.get(scenario.errors[index])),
    );
  }
}
