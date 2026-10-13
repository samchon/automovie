import { TestValidator } from "@nestia/e2e";

import type { IHumanBuildHost } from "../../../../packages/human/build/IHumanBuildHost";
import { runHumanBuild } from "../../../../packages/human/build/runHumanBuild";

/**
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
 */
export async function test_package_build_publication(): Promise<void> {
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
    try { await runHumanBuild(host); } catch (error) { failure = error; }
    const errors = failure instanceof AggregateError ? failure.errors : failure === undefined ? [] : [failure];
    TestValidator.equals("build effect order", observed, scenario.steps);
    TestValidator.equals("reported build failure count", errors.length, scenario.errors.length);
    TestValidator.predicate(
      "original build failures survive",
      errors.every((error, index) => error === effects.get(scenario.errors[index])),
    );
  }
}
