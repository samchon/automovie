import { CaptureComparison } from "../../../../../packages/human/src/inspection/CaptureComparison";
import { CaptureManifest } from "../../../../../packages/human/src/inspection/CaptureManifest";
import type { NodeCanvasTypes } from "../../../../../packages/human/src/inspection/NodeCanvasTypes";

type Frame = CaptureManifest.IFrame;

/**
 * `--compare` reads an earlier packet into reproducible cells and pairs them
 * with the new run's cells of the same key: an earlier `node:capture` cell
 * keeps its key and resolved camera, an earlier `node:arm-specs` neutral
 * frame becomes the arm part's original stage at the same-named camera (its
 * joint obliques the port close-ups), and a posed or unmappable earlier frame
 * is refused with its cause rather than paired with a different picture.
 *
 * Scenarios:
 * 1. Red proofs: the checker rejects a pairing that matches a different camera, one that calls a refitted camera exact, and one that pairs with an unavailable new cell.
 * 2. A made `node:arm-specs` manifest (neutral front, left, top, elbow-oblique; posed front; an unknown camera) reads as four `arm.left/part` original world cells (`front`, `left`, `top`, `closeup.elbow`) with no resolved camera, plus two refusals naming the pose and the camera.
 * 3. A made `node:capture` manifest keeps its drawn cells with their keys and cameras and refuses its unavailable cell with the recorded cause.
 * 4. Pairing: an equal key pairs, exact only when both resolved cameras are equal; a key the new run did not plan stays unpaired as not planned; a new unavailable cell leaves its earlier frame unpaired with the new cause.
 * 5. A manifest of neither tool throws.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls `CaptureComparison.read` and `pair` on made manifests and frame records, the seam `node:capture --compare` plans and pairs through.
 * @evidence contracts/testing.md#independent-expectations Expected cells are written by hand from the documented mapping (arm-specs frames are humerus-frame spec overlays of the arm; obliques map to port close-ups; poses other than neutral are not reproduced) and from key equality; no output of the implementation is copied.
 * @evidence contracts/testing.md#distinguishing-cases Both manifest kinds, neutral and posed frames, a mapped and an unmapped camera, drawn and unavailable cells, equal and different cameras, planned and unplanned keys, a foreign manifest. Red: three wrong pairings.
 * @evidence contracts/testing.md#execution-ownership A synchronous CPU unit reached by `--include human_capture_comparison`; no file, canvas or browser.
 */
export function test_human_capture_comparison(): void {
  const failures: string[] = [];

  // 2. node:arm-specs manifest.
  const armSpecs: CaptureComparison.IRead = CaptureComparison.read(
    {
      person: "f1",
      side: "left",
      frames: [
        { file: "neutral.front.png", pose: 0, camera: "front" },
        { file: "neutral.left.png", pose: 0, camera: "left" },
        { file: "neutral.top.png", pose: 0, camera: "top" },
        { file: "neutral.elbow-oblique.png", pose: 0, camera: "elbow-oblique" },
        { file: "flexed.front.png", pose: 1.2, camera: "front" },
        { file: "neutral.fish.png", pose: 0, camera: "fisheye" },
      ],
    },
    "arm.left",
  );
  const expectedCells: string[] = ["front", "left", "top", "closeup.elbow"].map((c: string): string => `world|arm.left/part|original|${c}`);
  const read: string[] = armSpecs.frames.map(CaptureManifest.key);
  if (armSpecs.tool !== "node:arm-specs" || JSON.stringify(read) !== JSON.stringify(expectedCells)) failures.push(`arm-specs cells ${armSpecs.tool}: ${read.join(", ")}`);
  if (armSpecs.frames.some((f: CaptureComparison.IEarlier): boolean => f.resolved !== null)) failures.push("an arm-specs frame claimed a resolved camera");
  const refused: string[] = armSpecs.refused.map((r: { file: string }): string => r.file);
  if (JSON.stringify(refused) !== JSON.stringify(["flexed.front.png", "neutral.fish.png"])) failures.push(`arm-specs refusals ${refused.join(", ")}`);
  if (!/1\.2/.test(armSpecs.refused[0]?.cause ?? "") || !/fisheye/.test(armSpecs.refused[1]?.cause ?? "")) failures.push(`arm-specs refusal causes ${armSpecs.refused.map((r: { cause: string }): string => r.cause).join(" | ")}`);

  // 3. node:capture manifest.
  const camA: NodeCanvasTypes.Camera = camera(1);
  const camB: NodeCanvasTypes.Camera = camera(2);
  const earlierFrames: Frame[] = [
    frame("local", "arm.left/part", "loft", "front", camA, "drawn"),
    frame("world", "whole", "clay", "top", camB, "drawn"),
    frame("world", "arm.left/neighbours", "clay", "left", null, "unavailable"),
  ];
  const own: CaptureComparison.IRead = CaptureComparison.read({ tool: "node:capture", frames: earlierFrames }, "arm.left");
  if (own.frames.length !== 2 || CaptureManifest.key(own.frames[0]!) !== "local|arm.left/part|loft|front" || own.frames[0]!.resolved !== camA) failures.push(`capture cells ${own.frames.map(CaptureManifest.key).join(", ")}`);
  if (own.refused.length !== 1 || !own.refused[0]!.cause.includes("no loft here")) failures.push(`capture refusals ${JSON.stringify(own.refused)}`);

  // 4. Pairing.
  const current: Frame[] = [
    frame("local", "arm.left/part", "loft", "front", camA, "drawn"),
    frame("world", "whole", "clay", "top", camera(3), "drawn"),
    frame("world", "arm.left/part", "original", "front", camA, "unavailable"),
  ];
  const earlier: CaptureComparison.IEarlier[] = [...own.frames, { frame: "world", selection: "arm.left/part", stage: "original", camera: "front", file: "e3.png", resolved: null }, { frame: "world", selection: "head/part", stage: "clay", camera: "front", file: "e4.png", resolved: null }];
  const paired: { pairs: CaptureComparison.IPair[]; unpaired: { file: string; cause: string }[] } = CaptureComparison.pair(earlier, current, CaptureManifest.key);
  failures.push(...checkPairs(paired));

  // 1. Red proofs.
  const wrongCamera: typeof paired = { ...paired, pairs: paired.pairs.map((p: CaptureComparison.IPair, k: number): CaptureComparison.IPair => (k === 0 ? { ...p, key: { ...p.key, camera: "left" } } : p)) };
  const falseExact: typeof paired = { ...paired, pairs: paired.pairs.map((p: CaptureComparison.IPair): CaptureComparison.IPair => ({ ...p, exactCamera: true })) };
  const pairedUnavailable: typeof paired = { pairs: [...paired.pairs, { key: { frame: "world", selection: "arm.left/part", stage: "original", camera: "front" }, earlier: "e3.png", current: "x.png", exactCamera: false }], unpaired: paired.unpaired.slice(1) };
  for (const [name, p] of [["a different camera", wrongCamera], ["a refitted camera called exact", falseExact], ["a pair with an unavailable new cell", pairedUnavailable]] as const)
    if (checkPairs(p).length === 0) failures.push(`proof: ${name} read as correct`);

  // 5. Foreign manifest.
  let threw: boolean = false;
  try {
    CaptureComparison.read({ files: [] }, "arm.left");
  } catch {
    threw = true;
  }
  if (!threw) failures.push("a foreign manifest did not throw");

  if (failures.length !== 0) throw new Error(`${failures.length} capture comparison findings:\n${failures.join("\n")}`);
}

/** Departures from the hand-written pairing of scenario 4. */
function checkPairs(p: { pairs: CaptureComparison.IPair[]; unpaired: { file: string; cause: string }[] }): string[] {
  const out: string[] = [];
  const got: string[] = p.pairs.map((x: CaptureComparison.IPair): string => `${CaptureManifest.key(x.key)}:${x.earlier}->${x.current}:${x.exactCamera}`);
  const want: string[] = ["local|arm.left/part|loft|front:local.arm.left/part.loft.front.png->local.arm.left/part.loft.front.png:true", "world|whole|clay|top:world.whole.clay.top.png->world.whole.clay.top.png:false"];
  if (JSON.stringify(got) !== JSON.stringify(want)) out.push(`pairs ${got.join(" ; ")}`);
  const un: string[] = p.unpaired.map((u: { file: string; cause: string }): string => `${u.file}:${u.cause.startsWith("new cell unavailable") ? "unavailable" : u.cause.startsWith("not planned") ? "not planned" : u.cause}`);
  if (JSON.stringify(un) !== JSON.stringify(["e3.png:unavailable", "e4.png:not planned"])) out.push(`unpaired ${un.join(" ; ")}`);
  return out;
}

/** A made frame record; its file names its key. */
function frame(f: CaptureManifest.FrameMode, selection: string, stage: CaptureManifest.IKey["stage"], cameraName: string, resolved: NodeCanvasTypes.Camera | null, status: "drawn" | "unavailable"): Frame {
  return {
    frame: f,
    selection,
    stage,
    camera: cameraName,
    status,
    cause: status === "drawn" ? null : "no loft here",
    file: status === "drawn" ? `${f}.${selection}.${stage}.${cameraName}.png` : null,
    sha256: status === "drawn" ? "0".repeat(64) : null,
    resolved,
    kind: "part",
    owner: "arm.left",
    parts: ["arm.left"],
    curve: null,
    displayFrame: "world",
    unavailable: [],
    curves: [],
    meshes: [],
    lineMode: "depth",
    referenceBackground: null,
    milliseconds: { display: 0, raster: 0, encode: 0, write: 0 },
  };
}

/** A made camera distinguished by its scale. */
function camera(scale: number): NodeCanvasTypes.Camera {
  return { name: "c", target: [0, 0, 0], back: [1, 0, 0], right: [0, 0, -1], up: [0, 1, 0], scale, width: 720, height: 720 };
}
