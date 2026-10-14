import { TestValidator } from "@nestia/e2e";

import type { IHumanBuildHost } from "../../../../packages/human/build/IHumanBuildHost";
import { runHumanBuild } from "../../../../packages/human/build/runHumanBuild";

/**
 * A package build publishes both compiled variants together and preserves the previous runtime until compilation succeeds. The actual owner is exercised through its typed effect port without launching a compiler or simulating a filesystem; requested-build errors retain identity.
 *
 * Scenarios:
 * 1. First publication and replacement wait for both successful compiler passes.
 * 2. Stage creation, either compiler pass, backup and install failures stop publication.
 * 3. Failed install restores a prior runtime; failed restoration retains both errors.
 * 4. Backup disposal and stage disposal failures remain observable, including concurrent failures.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls runHumanBuild and its actual publication orchestrator through the existing typed host port, observing stage authority, compiler/publication/rollback/disposal order and retained error identities. It detects premature installation, missing restoration and swallowed cleanup failures.
 * @evidence contracts/testing.md#independent-expectations Both compile effects must succeed before publication; prior-runtime presence independently determines backup/removal and failed installation requires restoration. Literal expected traces and failure objects are authored separately from results, while real compilation, byte publication and OS atomicity are not observed.
 * @evidence contracts/testing.md#distinguishing-cases Retains fourteen existing rows spanning first/replacement success, stage creation, either compile pass, backup, installation, restoration, backup removal and stage disposal failures, including combined failures and no-previous-runtime restoration. File replacement and digest membership have separate tests.
 * @evidence contracts/testing.md#execution-ownership The async discoverable test_package_build_publication entry owns every table row and awaits actual portable orchestration with local typed effects. It launches no compiler/process, builds no artifact, installs no consumer and opens no browser or GPU.
 */
export async function test_package_build_publication(): Promise<void> {
  const scenarios: {
    previous: boolean;
    failures: string[];
    steps: string[];
    errors: string[];
  }[] = [
    {
      previous: false,
      failures: [],
      steps: ["stage", "node", "browser", "install", "discard"],
      errors: [],
    },
    {
      previous: true,
      failures: [],
      steps: [
        "stage",
        "node",
        "browser",
        "backup",
        "install",
        "remove",
        "discard",
      ],
      errors: [],
    },
    {
      previous: true,
      failures: ["stage"],
      steps: ["stage"],
      errors: ["stage"],
    },
    {
      previous: true,
      failures: ["node"],
      steps: ["stage", "node", "discard"],
      errors: ["node"],
    },
    {
      previous: true,
      failures: ["browser"],
      steps: ["stage", "node", "browser", "discard"],
      errors: ["browser"],
    },
    {
      previous: true,
      failures: ["backup"],
      steps: ["stage", "node", "browser", "backup", "discard"],
      errors: ["backup"],
    },
    {
      previous: false,
      failures: ["install"],
      steps: ["stage", "node", "browser", "install", "restore", "discard"],
      errors: ["install"],
    },
    {
      previous: true,
      failures: ["install"],
      steps: [
        "stage",
        "node",
        "browser",
        "backup",
        "install",
        "restore",
        "remove",
        "discard",
      ],
      errors: ["install"],
    },
    {
      previous: true,
      failures: ["install", "restore"],
      steps: [
        "stage",
        "node",
        "browser",
        "backup",
        "install",
        "restore",
        "discard",
      ],
      errors: ["install", "restore"],
    },
    {
      previous: true,
      failures: ["remove"],
      steps: [
        "stage",
        "node",
        "browser",
        "backup",
        "install",
        "remove",
        "discard",
      ],
      errors: ["remove"],
    },
    {
      previous: false,
      failures: ["discard"],
      steps: ["stage", "node", "browser", "install", "discard"],
      errors: ["discard"],
    },
    {
      previous: true,
      failures: ["node", "discard"],
      steps: ["stage", "node", "discard"],
      errors: ["node", "discard"],
    },
    {
      previous: true,
      failures: ["install", "remove"],
      steps: [
        "stage",
        "node",
        "browser",
        "backup",
        "install",
        "restore",
        "remove",
        "discard",
      ],
      errors: ["install", "remove"],
    },
    {
      previous: false,
      failures: ["install", "restore"],
      steps: ["stage", "node", "browser", "install", "restore", "discard"],
      errors: ["install", "restore"],
    },
  ];
  for (const scenario of scenarios) {
    const observed: string[] = [];
    const effects: Map<string, Error> = new Map(
      scenario.failures.map((name: string): [string, Error] => [
        name,
        new Error(name),
      ]),
    );
    const step: (name: string) => void = (name: string): void => {
      observed.push(name);
      const failure: Error | undefined = effects.get(name);
      if (failure) throw failure;
    };
    const useStage: (stage: string, name: string) => void = (
      stage: string,
      name: string,
    ): void => {
      TestValidator.equals(
        "effects retain this build's stage",
        stage,
        "owned-output",
      );
      step(name);
    };
    const host: IHumanBuildHost = {
      createStage: (): string => {
        step("stage");
        return "owned-output";
      },
      compile: async (
        stage: string,
        pass: "node" | "browser",
      ): Promise<void> => {
        useStage(stage, pass);
      },
      hasPrevious: (): boolean => scenario.previous,
      backup: (stage: string): void => useStage(stage, "backup"),
      install: (stage: string): void => useStage(stage, "install"),
      restore: (stage: string): void => useStage(stage, "restore"),
      removeBackup: (stage: string): void => useStage(stage, "remove"),
      discardStage: (stage: string): void => useStage(stage, "discard"),
    };
    let failure: unknown;
    try {
      await runHumanBuild(host);
    } catch (error) {
      failure = error;
    }
    const errors: unknown[] =
      failure instanceof AggregateError
        ? failure.errors
        : failure === undefined
          ? []
          : [failure];
    TestValidator.equals("build effect order", observed, scenario.steps);
    TestValidator.equals(
      "reported build failure count",
      errors.length,
      scenario.errors.length,
    );
    TestValidator.predicate(
      "original build failures survive",
      errors.every(
        (error: unknown, index: number): boolean =>
          error === effects.get(scenario.errors[index]),
      ),
    );
  }
}
