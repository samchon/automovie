import { CaptureOptions } from "../../../../../packages/human/src/inspection/CaptureOptions";

/**
 * The capture's command line separates list members by commas or
 * whitespace, because PowerShell hands an unquoted `a,b` to pnpm as `a b`,
 * while an unknown member, flag or missing value still refuses the command
 * instead of silently widening or emptying the capture.
 *
 * Scenarios:
 * 1. Red proofs: the list checker rejects a parse that kept `original clay` as one member and one that dropped the second member.
 * 2. `original,clay`, `original clay`, ` original , clay ` and `original,,clay` each give exactly [original, clay]; `--frame local world` gives [local, world]; part globs split the same way.
 * 3. Defaults with no flags: parts `*`, all scopes and stages, views `*`, frames local and world, neutral pose, size 720, cell 300, reference cache `rows`.
 * 4. Refusals: an unknown member (`originalclay`), an unknown flag, a flag without a value, a value starting with `--`, and an out-of-range size all throw.
 * 5. A plan supplies values the flags do not, and a flag overrides the plan.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls `CaptureOptions.parse` on argv arrays as `node:capture` receives them and asserts the resolved options or the thrown refusal.
 * @evidence contracts/testing.md#independent-expectations Expected lists are written by hand from the documented separator rule and the documented defaults; no parse output is copied.
 * @evidence contracts/testing.md#distinguishing-cases Commas, spaces, padding and empty members; every list flag kind; defaults; five refusals; plan versus flag precedence. Red: an unsplit and a truncated list.
 * @evidence contracts/testing.md#execution-ownership A synchronous CPU unit reached by `--include human_capture_options`; no process, file or canvas.
 */
export function test_human_capture_options(): void {
  const failures: string[] = [];
  const want: string = JSON.stringify(["original", "clay"]);

  // 1. Red proofs.
  if (listFinding(["original clay"], want) === null) failures.push("proof: an unsplit member read as two members");
  if (listFinding(["original"], want) === null) failures.push("proof: a dropped member read as complete");

  // 2. Separators.
  for (const raw of ["original,clay", "original clay", " original , clay ", "original,,clay"]) {
    const finding: string | null = listFinding(CaptureOptions.parse(["--stages", raw]).stages, want);
    if (finding !== null) failures.push(`stages "${raw}": ${finding}`);
  }
  if (JSON.stringify(CaptureOptions.parse(["--frame", "local world"]).frames) !== JSON.stringify(["local", "world"])) failures.push("frames with a space did not split");
  if (JSON.stringify(CaptureOptions.parse(["--parts", "arm.left leg.*"]).parts) !== JSON.stringify(["arm.left", "leg.*"])) failures.push("parts with a space did not split");

  // 3. Defaults.
  const d: CaptureOptions.IOptions = CaptureOptions.parse([]);
  const defaults: string = JSON.stringify({
    parts: ["*"],
    scopes: ["individual", "neighbours", "whole"],
    stages: ["original", "loft", "loft-clay", "clay", "reference"],
    views: ["*"],
    frames: ["local", "world"],
    pose: "neutral",
    compare: null,
    out: null,
    size: 720,
    cell: 300,
    referenceCache: "rows",
  });
  if (JSON.stringify(d) !== defaults) failures.push(`defaults ${JSON.stringify(d)}`);

  // 4. Refusals.
  for (const [name, argv] of [
    ["unknown member", ["--stages", "originalclay"]],
    ["unknown flag", ["--stage", "original"]],
    ["missing value", ["--parts"]],
    ["flag as value", ["--parts", "--views"]],
    ["size out of range", ["--size", "100"]],
  ] as const) {
    let threw: boolean = false;
    try {
      CaptureOptions.parse(argv);
    } catch {
      threw = true;
    }
    if (!threw) failures.push(`${name} did not throw`);
  }

  // 5. Plan and flag precedence.
  const planned: CaptureOptions.IOptions = CaptureOptions.parse(["--views", "front"], { views: ["top"], stages: ["clay"] });
  if (JSON.stringify(planned.views) !== JSON.stringify(["front"]) || JSON.stringify(planned.stages) !== JSON.stringify(["clay"])) failures.push(`plan precedence: views ${planned.views.join(",")}, stages ${planned.stages.join(",")}`);

  if (failures.length !== 0) throw new Error(`${failures.length} capture option findings:\n${failures.join("\n")}`);
}

/** Null when the list equals the expected JSON, otherwise the departure. */
function listFinding(list: readonly string[], expected: string): string | null {
  return JSON.stringify(list) === expected ? null : `got ${JSON.stringify(list)}`;
}
