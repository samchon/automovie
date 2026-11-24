import { FamilyConicCaseSelection as Input } from "../../../reference-conics/FamilyConicCaseSelection";

/**
 * Capture input chooses one resolved artifact case without solving or falling back.
 *
 * Scenarios:
 * 1. Selecting the second case retains that exact case and field object.
 * 2. Missing, infeasible, unavailable and duplicate cases are refused.
 * 3. An old schema, missing fingerprint and mismatched fingerprint are refused.
 * 4. A stage whose bundle digest is the one the round recorded at build is admitted although a source file has
 *    changed since, and the recorded source digest is kept; a stage from another build, a stage the round never
 *    built, a round with no bundle record and a malformed record are each refused by the stage's name.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the actual shared selection boundary and observes selected identity or refusal, without a figure or filesystem.
 * @evidence contracts/development/testing.md#independent-expectations Literal ids and source digests identify the requested second record; explicit unresolved statuses cannot be successful captures.
 * @evidence contracts/development/testing.md#distinguishing-cases A valid second-case counterpart accompanies every malformed selection and fingerprint in one accumulated round.
 * @evidence contracts/development/testing.md#execution-ownership Small made input records only; no anatomy, constructor, solver, renderer or process.
 * @evidence contracts/development/common.md#meaningful-documentation Names three numbered selection, status and provenance scenarios.
 */
export function test_human_capture_case_selection(): void {
  const first: {
    id: string;
    fields: { marker: number };
    resolution: { status: string };
  } = {
    id: "first",
    fields: { marker: 1 },
    resolution: { status: "resolved" },
  };
  const second: typeof first = {
    id: "second",
    fields: { marker: 2 },
    resolution: { status: "resolved" },
  };
  const infeasible: typeof first = {
    id: "infeasible",
    fields: { marker: 3 },
    resolution: { status: "infeasible" },
  };
  const unavailable: typeof first = {
    id: "unavailable",
    fields: { marker: 4 },
    resolution: { status: "unavailable" },
  };
  const hashes: Record<string, string> = {
    "packages/human/src/made.ts": "a".repeat(64),
  };
  const artifact: Input.IArtifact<typeof first> = {
    schema: "human-native-cases/v1",
    sourceHashes: hashes,
    cases: [first, second, infeasible, unavailable],
  };
  const failures: string[] = [];
  const selected: typeof first = Input.select(artifact, "second", hashes);
  if (selected !== second || selected.fields !== second.fields)
    failures.push("the second case and its fields were not retained");
  const cases: { name: string; read: () => unknown }[] = [
    {
      name: "missing case",
      read: (): unknown => Input.select(artifact, "missing", hashes),
    },
    {
      name: "infeasible case",
      read: (): unknown => Input.select(artifact, "infeasible", hashes),
    },
    {
      name: "unavailable case",
      read: (): unknown => Input.select(artifact, "unavailable", hashes),
    },
    {
      name: "duplicate case",
      read: (): unknown =>
        Input.select(
          { ...artifact, cases: [first, second, second] },
          "second",
          hashes,
        ),
    },
    {
      name: "old schema",
      read: (): unknown =>
        Input.select({ ...artifact, schema: "old" }, "second", hashes),
    },
    {
      name: "missing fingerprint",
      read: (): unknown =>
        Input.select({ ...artifact, sourceHashes: {} }, "second", hashes),
    },
    {
      name: "mismatched fingerprint",
      read: (): unknown =>
        Input.select(artifact, "second", {
          ...hashes,
          "packages/human/src/made.ts": "b".repeat(64),
        }),
    },
    {
      name: "incomplete fingerprint",
      read: (): unknown =>
        Input.select(artifact, "second", {
          ...hashes,
          "packages/human/src/other.ts": "c".repeat(64),
        }),
    },
  ];

  // Scenario 4: a stage is bound to its round by its bundle, not by the working tree.
  const round: Input.IArtifact<typeof first> = {
    ...artifact,
    bundles: { "capture.cjs": "d".repeat(64), "producer.cjs": "e".repeat(64) },
  };
  try {
    // The working tree's made.ts would now hash to "b"...: it is not consulted, so the stage is admitted.
    Input.bundle(round.bundles, { name: "capture.cjs", sha256: "D".repeat(64) });
    if (Input.select(round, "second", round.sourceHashes) !== second)
      failures.push("the round's own stage did not retain the second case");
    if (round.sourceHashes["packages/human/src/made.ts"] !== "a".repeat(64))
      failures.push("the source digest recorded at build was not kept for the receipt");
  } catch (error: unknown) {
    failures.push("a source saved after the build refused the round's own stage: " + String(error));
  }
  const strangers: { name: string; read: () => unknown; names: string }[] = [
    {
      name: "stage from another build",
      read: (): unknown => Input.bundle(round.bundles, { name: "capture.cjs", sha256: "f".repeat(64) }),
      names: "capture.cjs",
    },
    {
      name: "stage the round never built",
      read: (): unknown => Input.bundle(round.bundles, { name: "FamilyConicOther.cjs", sha256: "d".repeat(64) }),
      names: "FamilyConicOther.cjs",
    },
    {
      name: "round without a bundle record",
      read: (): unknown => Input.bundle(artifact.bundles, { name: "capture.cjs", sha256: "d".repeat(64) }),
      names: "capture.cjs",
    },
    {
      name: "malformed bundle record",
      read: (): unknown => Input.bundle({ "capture.cjs": "short" }, { name: "capture.cjs", sha256: "d".repeat(64) }),
      names: "capture.cjs",
    },
  ];
  for (const scenario of strangers) {
    let message: string | null = null;
    try {
      scenario.read();
    } catch (error: unknown) {
      message = error instanceof Error ? error.message : String(error);
    }
    if (message === null) failures.push(scenario.name + " was accepted");
    else if (!message.includes(scenario.names)) failures.push(scenario.name + " was refused without naming " + scenario.names);
  }
  for (const scenario of cases) {
    let refused: boolean = false;
    try {
      scenario.read();
    } catch {
      refused = true;
    }
    if (!refused) failures.push(scenario.name + " was accepted");
  }
  if (failures.length !== 0) throw new Error(failures.join("\n"));
}
