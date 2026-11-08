import { CaptureManifest } from "../../../../../packages/human/src/inspection/CaptureManifest";
import type { CaptureSelection } from "../../../../../packages/human/src/inspection/CaptureSelection";

type Frame = CaptureManifest.IFrame;
type Key = CaptureManifest.IKey;

/**
 * The capture's manifest is complete only when every planned cell has
 * exactly one record, each drawn record carries its file, SHA-256 and
 * resolved camera, each unavailable record its cause, and every phase time is
 * finite and non-negative; the plan has one cell per frame mode, selection,
 * stage of that selection and camera of that selection.
 *
 * Scenarios:
 * 1. The plan of a curve row (original only, three cameras) and a part row (four stages, two cameras) over two frame modes has 2 x (1 x 3 + 4 x 2) = 22 distinct cells, each with its own selection's stages and cameras.
 * 2. Records matching the plan, one of them unavailable with a cause, are complete (no problem).
 * 3. Red/green per defect, each found by name: a missing cell, a duplicated cell, an unplanned cell, a drawn cell without file, one with a malformed SHA-256, one without a resolved camera, an unavailable cell with an empty cause, a NaN and a negative timing.
 * 4. An empty plan with no records is complete; an empty plan with a record reports it unplanned.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls `CaptureManifest.plan`, `key` and `problems`, which `node:capture` runs over its own records before writing the manifest.
 * @evidence contracts/development/testing.md#independent-expectations The cell count is the hand product of the made rows; each defect is introduced by hand into a complete record set and its expected finding named from the documented completeness rule.
 * @evidence contracts/development/testing.md#distinguishing-cases Two frame modes, rows with different stages and cameras, drawn and unavailable records, nine separate defects, empty plans with and without records.
 * @evidence contracts/development/testing.md#execution-ownership A synchronous CPU unit reached by `--include human_capture_manifest`; no file, canvas or browser.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: The plan of a curve row (original only, three cameras) and a part row (four stages, two cameras) over two frame modes has 2 x (1 x 3 + 4 x...).
 */
export function test_human_capture_manifest(): void {
  const failures: string[] = [];
  const rows: CaptureSelection.ISelection[] = [
    {
      id: "a/curve/c",
      scope: "individual",
      kind: "curve",
      owner: "a",
      parts: ["a"],
      curve: "c",
      stages: ["original"],
      unavailable: [],
    },
    {
      id: "a/part",
      scope: "individual",
      kind: "part",
      owner: "a",
      parts: ["a"],
      curve: null,
      stages: ["original", "loft", "loft-clay", "clay"],
      unavailable: [],
    },
  ];
  const cameras: (s: CaptureSelection.ISelection) => string[] = (
    s: CaptureSelection.ISelection,
  ): string[] =>
    s.kind === "curve" ? ["front", "left", "closeup.elbow"] : ["front", "top"];

  // 1. Plan size and membership.
  const plan: Key[] = CaptureManifest.plan(rows, ["local", "world"], cameras);
  const keys: Set<string> = new Set(plan.map(CaptureManifest.key));
  if (plan.length !== 22 || keys.size !== 22)
    failures.push(
      `plan has ${plan.length} cells, ${keys.size} distinct, instead of 22`,
    );
  if (
    !keys.has("world|a/curve/c|original|closeup.elbow") ||
    keys.has("world|a/curve/c|loft|front") ||
    keys.has("local|a/part|clay|left")
  )
    failures.push("plan membership departs from the rows' stages and cameras");

  // 2. Complete records.
  const records: Frame[] = plan.map(
    (k: Key, i: number): Frame => record(k, i === 3 ? "unavailable" : "drawn"),
  );
  const clean: string[] = CaptureManifest.problems(plan, records);
  if (clean.length !== 0)
    failures.push(`complete records read as incomplete: ${clean.join("; ")}`);

  // 3. One defect at a time.
  const defects: [string, Frame[], string][] = [
    ["missing cell", records.slice(1), "missing cell"],
    ["duplicated cell", [...records, records[0]!], "recorded 2 times"],
    [
      "unplanned cell",
      [
        ...records,
        record(
          {
            frame: "world",
            selection: "b/part",
            stage: "clay",
            camera: "front",
          },
          "drawn",
        ),
      ],
      "unplanned cell",
    ],
    ["drawn without file", edit(records, 0, { file: null }), "without file"],
    [
      "malformed SHA-256",
      edit(records, 0, { sha256: "abc" }),
      "without SHA-256",
    ],
    [
      "drawn without camera",
      edit(records, 0, { resolved: null }),
      "without resolved camera",
    ],
    [
      "unavailable with empty cause",
      edit(records, 3, { cause: "  " }),
      "without cause",
    ],
    [
      "NaN timing",
      edit(records, 1, {
        milliseconds: { display: NaN, raster: 0, encode: 0, write: 0 },
      }),
      "invalid display time",
    ],
    [
      "negative timing",
      edit(records, 1, {
        milliseconds: { display: 0, raster: 0, encode: -1, write: 0 },
      }),
      "invalid encode time",
    ],
  ];
  for (const [name, frames, finding] of defects) {
    const found: string[] = CaptureManifest.problems(plan, frames);
    if (!found.some((p: string): boolean => p.includes(finding)))
      failures.push(`${name}: not found (${found.join("; ") || "no problem"})`);
  }

  // 4. Empty plans.
  if (CaptureManifest.problems([], []).length !== 0)
    failures.push("an empty plan with no record read as incomplete");
  if (
    !CaptureManifest.problems([], [records[0]!]).some((p: string): boolean =>
      p.startsWith("unplanned cell"),
    )
  )
    failures.push("an empty plan accepted a record");

  if (failures.length !== 0)
    throw new Error(
      `${failures.length} capture manifest findings:\n${failures.join("\n")}`,
    );
}

/** A record of a key, drawn with file, hash and camera, or unavailable with a cause. */
function record(k: Key, status: "drawn" | "unavailable"): Frame {
  return {
    ...k,
    status,
    cause: status === "drawn" ? null : "no loft chain",
    file: status === "drawn" ? `${CaptureManifest.key(k)}.png` : null,
    sha256: status === "drawn" ? "a".repeat(64) : null,
    resolved:
      status === "drawn"
        ? {
            name: k.camera,
            target: [0, 0, 0],
            back: [1, 0, 0],
            right: [0, 0, -1],
            up: [0, 1, 0],
            scale: 1000,
            width: 720,
            height: 720,
          }
        : null,
    kind: k.selection.includes("/curve/") ? "curve" : "part",
    owner: "a",
    parts: ["a"],
    curve: null,
    displayFrame: "world",
    unavailable: [],
    curves: [],
    meshes: [],
    lineMode: "depth",
    referenceBackground: null,
    milliseconds: { display: 1, raster: 2, encode: 3, write: 4 },
  };
}

/** The records with one field set changed. */
function edit(
  frames: readonly Frame[],
  i: number,
  change: Partial<Frame>,
): Frame[] {
  return frames.map(
    (f: Frame, k: number): Frame => (k === i ? { ...f, ...change } : f),
  );
}
