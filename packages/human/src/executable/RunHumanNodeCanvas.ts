import type {
  IAutoMovieModel,
  IAutoMovieModelPart,
} from "@automovie/interface";
import fs from "node:fs/promises";
import path from "node:path";

import { HumanInspectionReferenceMesh } from "../inspection/HumanInspectionReferenceMesh";
import type { HumanTorsoObservation } from "../inspection/HumanTorsoObservation";
import { NodeCanvasCamera } from "../inspection/NodeCanvasCamera";
import type { NodeCanvasTypes } from "../inspection/NodeCanvasTypes";
import { HumanCurveCostReport as R } from "./HumanCurveCostReport";
import { HumanNodeArtifacts } from "./HumanNodeArtifacts";
import { HumanNodeInput } from "./HumanNodeInput";
import { HumanNodePaths } from "./HumanNodePaths";
import { NodeCanvasDefault } from "./NodeCanvasDefault";
import { NodeCanvasGallery } from "./NodeCanvasGallery";

/** Actual entry clock, after ttsx/module loading, distinct from the invoking shell timestamp. */
const PROGRAM_STARTED: string = new Date().toISOString();

/**
 * Direct Node f1 rendering experiment using the unchanged production source owners and reference.
 * Writes only under its ignored task directory. No HTTP, browser, viewer or server is used.
 * Seven camera directions observe originals individually/grouped/whole-scoped, and selected
 * actual production raw loft curves/overlay/clay. A scoped overview does not assert a completed
 * construction tree. Final realization and GPU appearance validation are explicitly not run.
 */
export async function RunHumanNodeCanvas(
  argv: readonly string[],
  entry: {
    /** UTC at the minimal entry before production imports. */
    startedUtc: string;

    /** Wall milliseconds for runtime loader and production import/evaluation, including any deferred transformation. */
    importMilliseconds: number;
  },
): Promise<void> {
  if (argv[0] === "--gallery" && argv.length === 2 && argv[1] !== undefined) {
    await NodeCanvasGallery(argv[1]);
    return;
  }
  const referenceCacheCheck: boolean =
    argv.at(-1) === "--reference-cache-check";
  const renderArgs: readonly string[] = referenceCacheCheck
    ? argv.slice(0, -1)
    : argv;
  const firstOnly: boolean = renderArgs[0] === "--first-original";
  const originalOnly: boolean = renderArgs[0] === "--originals" || firstOnly;
  const all: boolean = renderArgs[0] === "--all" || originalOnly;
  const pairsOnly: boolean = renderArgs[0] === "--pairs-only";
  if (
    !(
      renderArgs.length === 0 ||
      (renderArgs.length === 1 &&
        [
          "--reference-only",
          "--all",
          "--originals",
          "--first-original",
        ].includes(renderArgs[0]!)) ||
      (renderArgs[0] === "--all" &&
        renderArgs.length === 3 &&
        renderArgs[1] === "--pairs") ||
      (pairsOnly && renderArgs.length === 2)
    )
  )
    throw new Error(
      "Usage: pnpm --dir packages/human node:canvas [--reference-only|--first-original|--originals|--all [--pairs <data.json>]|--pairs-only <data.json>|--gallery <completed-packet>]",
    );

  if (referenceCacheCheck && !firstOnly)
    throw new Error("--reference-cache-check requires --first-original");
  const root: string = HumanNodePaths.root();
  const task: string = path.resolve(
    root,
    "packages/human/.shots/node_canvas_xhigh",
  );
  const out: string = path.join(
    task,
    "run-" + PROGRAM_STARTED.replaceAll(/[:.]/g, "-"),
  );
  await fs.mkdir(out, { recursive: true });
  const started: number = performance.now();
  const rasterModule: typeof import("./NodeCanvasRaster.js") =
    await import("./NodeCanvasRaster.js");
  const NodeCanvasRaster: typeof rasterModule.NodeCanvasRaster =
    rasterModule.NodeCanvasRaster;
  const nativeImported: number = performance.now();
  const native: ReturnType<typeof NodeCanvasRaster.initialize> & {
    moduleLoadMilliseconds: number;
  } = {
    ...NodeCanvasRaster.initialize(),
    moduleLoadMilliseconds: nativeImported - started,
  };
  process.stdout.write(
    JSON.stringify({
      event: "program-start",
      utc: PROGRAM_STARTED,
      out,
      native,
    }) + "\n",
  );

  const referenceStarted: number = performance.now();
  const referencePath: string = path.join(
    root,
    "test/.shots/f1/reference-model.json",
  );
  const referenceBytes: Buffer = await fs.readFile(referencePath);
  const referenceRead: number = performance.now();
  const referenceSha256: string = hash(referenceBytes);
  // This is the adopted typed artifact; its existing adapter validates every static mesh buffer.
  const referenceModel: IAutoMovieModel = JSON.parse(
    referenceBytes.toString("utf8"),
  ) as IAutoMovieModel;
  const referenceParsed: number = performance.now();
  const reference: ReturnType<typeof HumanInspectionReferenceMesh> =
    HumanInspectionReferenceMesh(referenceModel);
  const referenceMeshes: NodeCanvasTypes.Mesh[] = reference.parts.map(
    (part: IAutoMovieModelPart): NodeCanvasTypes.Mesh => {
      if (part.geometry.type !== "mesh" || part.geometry.mesh.indices === null)
        throw new Error("Static reference mesh is unavailable");
      return {
        id: part.id,
        positions: part.geometry.mesh.positions,
        indices: part.geometry.mesh.indices,
        colour: [0.46, 0.51, 0.57],
      };
    },
  );
  const referencePoints: NodeCanvasTypes.Point[] = referenceMeshes.flatMap(
    (mesh: NodeCanvasTypes.Mesh): NodeCanvasTypes.Point[] =>
      triples(mesh.positions),
  );
  const referenceReady: number = performance.now();
  const frames: NodeCanvasTypes.Frame[] = [];
  const details: Record<string, unknown> = {};
  const cacheImportStarted: number = performance.now();
  const cacheModule: typeof import("./NodeCanvasReferenceBackground.js") =
    await import("./NodeCanvasReferenceBackground.js");
  const cacheImported: number = performance.now();
  const backgrounds: import("./NodeCanvasReferenceBackground").NodeCanvasReferenceBackground.IOwner =
    await cacheModule.NodeCanvasReferenceBackground.create(
      referenceSha256,
      referenceMeshes,
    );
  details.referenceBackgroundPreparation = {
    moduleImportMilliseconds: cacheImported - cacheImportStarted,
    identityMilliseconds: backgrounds.identityMilliseconds,
    boundary:
      "Reference/display/renderer identity only; excludes original construction. Reference read/parse/adaptation remain measured above.",
  };
  let cacheChecked: boolean = false;
  const manifest: Record<string, unknown> = {
    status: "running",
    arguments: [...argv],
    requestedStage: firstOnly
      ? "one-original-reference-overlay; no full inventory"
      : originalOnly
        ? "all-available-originals"
        : "existing requested renderer scope",
    programStartedUtc: PROGRAM_STARTED,
    entry,
    importBoundary:
      "Entry importMilliseconds includes runtime loader/deferred preparation and production static imports/evaluation; source/geometry calls are timed separately",
    startupBoundary:
      "program-start excludes ttsx preflight and static import evaluation; the invoking caller records its shell clock in a separate sidecar without changing environment or argv",
    node: process.version,
    platform: process.platform,
    architecture: process.arch,
    backend: native,
    output: out,
    reference: {
      path: referencePath,
      sha256: referenceSha256,
      bytes: referenceBytes.length,
      regions: reference.regions,
      loadingAndSceneMilliseconds: referenceReady - referenceStarted,
      milliseconds: {
        read: referenceRead - referenceStarted,
        parseAndHash: referenceParsed - referenceRead,
        adapterAndScene: referenceReady - referenceParsed,
      },
    },
    method: {
      camera: "explicit orthographic CPU basis",
      surface: "per-pixel barycentric z-buffer, flat two-sided Lambert clay",
      curves:
        "existing producer polylines; requested row xray/depth plus explicit always-through axis overrides",
      canvas: "native Skia Canvas2D image upload, captions and PNG encode",
      gpu: false,
      finalRealization: "not-run",
      surfaceLimitations:
        "No PBR, normal maps, shadows, transparency, antialiasing, GPU equivalence or winding acceptance. Raw display includes the existing isolated end fans; no final Boolean joins are performed.",
    },
    source: details,
    frames,
  };
  /** Atomic latest manifest preserves completed rows if a subsequent source fails. */
  const save: () => Promise<void> = async (): Promise<void> => {
    const temporary: string = path.join(out, "manifest.next.json");
    await fs.writeFile(temporary, JSON.stringify(manifest, null, 2));
    await fs.rename(temporary, path.join(out, "manifest.json"));
  };
  /** Keeps encode separate from disk writing, and saves exact camera/id/hash facts per PNG. */
  const capture: (
    scope: string,
    stage: string,
    camera: NodeCanvasTypes.Camera,
    meshes: readonly NodeCanvasTypes.Mesh[],
    curves: readonly NodeCanvasTypes.Curve[],
    lineMode: "xray" | "depth",
  ) => Promise<void> = async (
    scope: string,
    stage: string,
    camera: NodeCanvasTypes.Camera,
    meshes: readonly NodeCanvasTypes.Mesh[],
    curves: readonly NodeCanvasTypes.Curve[],
    lineMode: "xray" | "depth",
  ): Promise<void> => {
    const rendered: import("./NodeCanvasReferenceBackground").NodeCanvasReferenceBackground.IRender =
      await backgrounds.render(
        camera,
        meshes,
        curves,
        lineMode,
        scope + " | " + stage,
      );
    const file: string =
      [String(frames.length).padStart(4, "0"), scope, stage, camera.name]
        .join(".")
        .replaceAll(/[^\w.-]/g, "_") + ".png";
    frames.push(
      await HumanNodeArtifacts.frame(
        out,
        file,
        {
          camera,
          stage,
          scope,
          meshes,
          curves,
          lineMode,
        },
        rendered,
      ),
    );
    await fs.writeFile(
      path.join(out, file + ".json"),
      JSON.stringify(frames.at(-1), null, 2),
    );
    if (!all || frames.length % 25 === 0) await save();
    process.stdout.write(
      JSON.stringify({
        event: "frame",
        file,
        milliseconds: frames.at(-1)!.milliseconds,
        pixels: rendered.pixels,
      }) + "\n",
    );

    // Record the real first request before diagnostic replays can warm its background.
    if (referenceCacheCheck && !cacheChecked && curves.length !== 0) {
      cacheChecked = true;
      const check: typeof import("./NodeCanvasReferenceCheck.js") =
        await import("./NodeCanvasReferenceCheck.js");
      const result: import("./NodeCanvasReferenceCheck").NodeCanvasReferenceCheck.IOutput =
        await check.NodeCanvasReferenceCheck.run(
          backgrounds,
          referenceSha256,
          referenceMeshes,
          camera,
          meshes,
          curves,
        );
      details.referenceCacheCheck = result;
      await save();
      if (result.status !== "passed")
        throw new Error(
          "Reference cache comparison: " + result.failures.join("; "),
        );
    }
  };
  const session: NodeCanvasTypes.Session = {
    referenceModel,
    referenceSha256,
    referenceMeshes,
    details,
    capture,
    save,
  };
  const sourceDirectory: string = path.join(out, "source");
  let epochAtStart: Record<string, string> = {};
  let initial: HumanTorsoObservation.IOutput | undefined;
  const executionErrors: unknown[] = [];
  let completion: "complete" | "partial" | "failed" = "complete";
  await save();
  try {
    const hashStarted: number = performance.now();
    const missing: string[] = [];
    epochAtStart = R.sources(missing);
    details.beforeMissing = missing;
    details.before = epochAtStart;
    details.initialSourceHashMilliseconds = performance.now() - hashStarted;
    await save();
    if (originalOnly) {
      const inputStarted: number = performance.now();
      const person: Awaited<ReturnType<typeof HumanNodeInput.of>> =
        await HumanNodeInput.of();
      details.firstInputLoadMilliseconds = performance.now() - inputStarted;
      details.input = {
        typedPath: "packages/playground/src/human-parameters/f1.ts",
        typedSha256:
          epochAtStart["packages/playground/src/human-parameters/f1.ts"],
        runtimeSha256: hash(JSON.stringify(person.parameters)),
        parameters: person.parameters,
      };
      const display: typeof import("./NodeCanvasSourceDisplay.js") =
        await import("./NodeCanvasSourceDisplay.js");
      initial = await display.NodeCanvasSourceDisplay.first(
        session,
        person,
        !firstOnly,
      );
    }
    const snapshotStarted: number = performance.now();
    await HumanNodeArtifacts.sources(
      Object.keys(epochAtStart),
      sourceDirectory,
      epochAtStart,
    );
    details.sourceSnapshot = {
      directory: sourceDirectory,
      files: Object.keys(epochAtStart).length,
      milliseconds: performance.now() - snapshotStarted,
      boundary:
        "Byte copy/write after the first original when requested, each file checked against the previously preserved SHA. Hash acquisition and geometry have separate timers; a mismatch fails the packet.",
    };
    details.before = epochAtStart;
    await save();
    if (!pairsOnly && !firstOnly)
      await capture(
        "whole",
        "native-reference",
        NodeCanvasCamera.fit("front", referencePoints),
        referenceMeshes,
        [],
        "depth",
      );
    manifest.initialPacketMilliseconds = performance.now() - started;
    manifest.initialPacketBoundary =
      "Starts before native Canvas import and ends after the requested first original/reference frames and source byte archival. Includes these nested stages; not reference-only work or pure compilation time.";
    if (!firstOnly && (all || pairsOnly)) {
      const epoch: Record<string, string> = epochAtStart;
      const inventoryImportStarted: number = performance.now();
      const inventory: typeof import("./NodeCanvasInventory.js") =
        await import("./NodeCanvasInventory.js");
      details.inventoryModuleImportMilliseconds =
        performance.now() - inventoryImportStarted;
      details.before = epoch;
      const outcome: import("./NodeCanvasInventory").NodeCanvasInventory.IOutcome =
        pairsOnly
          ? await inventory.NodeCanvasInventory.compare(session, argv[1]!)
          : await inventory.NodeCanvasInventory.run(
              session,
              argv[2],
              originalOnly,
              initial,
            );
      completion = outcome.status;
      details.outcome = outcome;
      const afterMissing: string[] = [];
      const after: Record<string, string> = R.sources(afterMissing);
      details.afterMissing = afterMissing;
      details.after = after;
      details.changedDuringRun = [
        ...new Set([...Object.keys(epoch), ...Object.keys(after)]),
      ].filter((file: string): boolean => after[file] !== epoch[file]);
      details.sourceBoundary =
        "Actual production source observations; disk hashes do not independently seal ttsx consumed transformed modules. Targets include failures, not just PNG successes.";
    } else if (!firstOnly && argv[0] !== "--reference-only") {
      completion = await NodeCanvasDefault(session, epochAtStart);
    }
  } catch (error: unknown) {
    executionErrors.push(error);
    completion = "failed";
    details.executionErrors = executionErrors.map(R.message);
  }
  if (details.after === undefined) {
    try {
      const afterMissing: string[] = [];
      const after: Record<string, string> = R.sources(afterMissing);
      details.afterMissing = afterMissing;
      details.after = after;
      details.changedDuringRun = [
        ...new Set([...Object.keys(epochAtStart), ...Object.keys(after)]),
      ].filter((file: string): boolean => after[file] !== epochAtStart[file]);
    } catch (error: unknown) {
      executionErrors.push(error);
      completion = "failed";
      details.executionErrors = executionErrors.map(R.message);
    }
  }
  if (
    Array.isArray(details.changedDuringRun) &&
    details.changedDuringRun.length !== 0
  )
    completion = "failed";
  details.sourceBoundary =
    "Tracked disk hashes and verified archived bytes name their actual scope; they do not independently seal ttsx's consumed transformed module graph. Missing tracked files remain separate from byte hashes.";
  manifest.status = completion + "-unreviewed";
  if (originalOnly)
    details.originalCoverage = [
      ...new Set(
        frames.flatMap(
          (frame: NodeCanvasTypes.Frame): string[] => frame.curves,
        ),
      ),
    ].map(
      (id: string): Record<string, unknown> => ({
        id,
        individual: frames
          .filter(
            (frame: NodeCanvasTypes.Frame): boolean =>
              ["original-individual", "original-first"].includes(frame.stage) &&
              frame.scope === id,
          )
          .map((frame: NodeCanvasTypes.Frame): string => frame.file),
        placement: frames
          .filter(
            (frame: NodeCanvasTypes.Frame): boolean =>
              [
                "original-first",
                "original-part",
                "original-neighbours",
                "original-composed-neighbours",
                "original-all",
              ].includes(frame.stage) && frame.curves.includes(id),
          )
          .map(
            (
              frame: NodeCanvasTypes.Frame,
            ): { file: string; stage: string; camera: string } => ({
              file: frame.file,
              stage: frame.stage,
              camera: frame.camera.name,
            }),
          ),
        personalInspection: "unread; capture coverage is not acceptance",
      }),
    );
  manifest.completionPolicy =
    "Partial or refused requests retain their PNGs and details, but exit nonzero. Complete means requested capture completion, not geometry or appearance acceptance.";
  if (completion !== "complete") process.exitCode = 1;
  manifest.completedUtc = new Date().toISOString();
  manifest.programMilliseconds = performance.now() - started;
  manifest.pngCount = frames.length;
  try {
    await save();
  } catch (error: unknown) {
    executionErrors.push(error);
  }
  try {
    await HumanNodeArtifacts.index(out, frames);
  } catch (error: unknown) {
    executionErrors.push(error);
  }
  process.stdout.write(
    JSON.stringify({
      event: "complete",
      status: manifest.status,
      out,
      frames: frames.length,
      milliseconds: manifest.programMilliseconds,
      utc: manifest.completedUtc,
    }) + "\n",
  );
  if (executionErrors.length !== 0)
    throw new AggregateError(
      executionErrors,
      "Node capture or result persistence failed",
      { cause: executionErrors[0] },
    );
}

/** Converts a flat borrowed display buffer without changing any coordinate. */
function triples(values: readonly number[]): NodeCanvasTypes.Point[] {
  const points: NodeCanvasTypes.Point[] = [];
  for (let i: number = 0; i < values.length; i += 3)
    points.push([values[i]!, values[i + 1]!, values[i + 2]!]);
  return points;
}

/** Existing artifact hashing is shared by both actual PNG entries. */
const { hash }: Pick<typeof HumanNodeArtifacts, "hash"> = HumanNodeArtifacts;
