import { decodeAutoMoviePpmImage } from "@automovie/ingest/ppm";
import type { IAutoMovieRecoveryCameraMapInput } from "@automovie/interface/recovery";
import { createHash } from "node:crypto";
import path from "node:path";

import { estimateAutoMovieRecoveryCameraMap } from "../../observation/estimateAutoMovieRecoveryCameraMap";
import type { IAutoMovieRecoveryCameraMapFiles } from "../../structures/image/IAutoMovieRecoveryCameraMapFiles";
import { writeAutoMovieRecoveryArtifact } from "../artifact/writeAutoMovieRecoveryArtifact";
import { readAutoMovieRecoveryBoundedFile } from "./readAutoMovieRecoveryBoundedFile";

/**
 * Acquire fixed three-image bytes and publish one immutable sparse-map artifact.
 * The command is cameras map input.json new-output.json maxInputBytes. Completed
 * seed-only/refused geometry still has an artifact; a no-value failure has none.
 *
 * @evidence contracts/common.md#principled-implementation Bounded complete reads and SHA checks precede explicit unchanged-chart sRGB P6 decoding. One public resident map operation supplies geometry, and immutable publication preserves source epoch, manifest identity and authoritative stage qualification.
 * @evidence contracts/common.md#clear-and-simple-design This Node owner handles paths, byte provenance, decoding and publication; resident recovery owns automatic observation, track geometry and policy.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No source scan, unverified image, transform fallback, truth camera, inferred calibration, changed numerical threshold, overwrite or installation supplies a result.
 * @evidence contracts/common.md#meaningful-documentation States command arguments, relative paths, per-file and aggregate pixel limits, source epoch, unchanged chart and computation versus accepted map semantics.
 * @evidence contracts/performance.md#efficient-algorithms Three bounded reads/hashes cost O(B), decoding O(P), followed by the public map's explicit work limits. Remaining aggregate pixels are decremented before each raster allocation; serialization scales with the bounded sparse artifact.
 * @evidence contracts/performance.md#reuse-equivalent-work Each declared source is acquired/hashed once; a single public operation supplies the artifact with unchanged metadata, and there is no repeated geometry or effect cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Bounded readers close their own descriptors; at most three rasters accumulate under the aggregate ceiling and expire after estimation. The existing atomic writer owns staging cleanup and no RGB enters the published JSON.
 */
export function recoveryCameraMap(args: string[], sourceEpoch: string): void {
  const [command, inputPath, outputPath, byteText]: string[] = args;
  const maxInputBytes: number = Number(byteText);
  if (
    args.length !== 4 ||
    command !== "map" ||
    !inputPath ||
    !outputPath ||
    !Number.isSafeInteger(maxInputBytes) ||
    maxInputBytes < 1
  )
    throw new Error(
      "Usage: cameras map input.json new-output.json maxInputBytes",
    );
  const bytes: Buffer = readAutoMovieRecoveryBoundedFile(
    inputPath,
    maxInputBytes,
  );
  const inputSha256: string = createHash("sha256").update(bytes).digest("hex");
  const spec: IAutoMovieRecoveryCameraMapFiles = JSON.parse(
    bytes.toString("utf8"),
  ) as IAutoMovieRecoveryCameraMapFiles;
  const closed: (value: object, expected: readonly string[]) => boolean = (
    value: object,
    expected: readonly string[],
  ): boolean =>
    !!value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Reflect.ownKeys(value).length === expected.length &&
    Reflect.ownKeys(value).every(
      (key: string | symbol): boolean =>
        typeof key === "string" && expected.includes(key),
    );
  if (
    !closed(spec, [
      "schema",
      "encoding",
      "capture",
      "maxHeaderBytes",
      "views",
    ]) ||
    spec.schema !== "automovie-recovery-camera-map-files-v1" ||
    spec.encoding !== "ppm-srgb-rgb8-v1" ||
    !closed(spec.capture, [
      "schema",
      "objectId",
      "rigidity",
      "cohort",
      "seedPolicy",
      "seedBudget",
      "policy",
      "budget",
    ]) ||
    !spec.capture.budget ||
    !Number.isSafeInteger(spec.capture.budget.maxPixels) ||
    spec.capture.budget.maxPixels < 1 ||
    !Number.isSafeInteger(spec.maxHeaderBytes) ||
    spec.maxHeaderBytes < 1 ||
    !Array.isArray(spec.views) ||
    spec.views.length !== 3
  )
    throw new Error(
      "A closed three-image camera-map manifest with explicit pixel/header budgets is required",
    );
  const started: number = performance.now();
  const views: IAutoMovieRecoveryCameraMapInput["views"] = [];
  let pixels: number = 0;
  for (const view of spec.views) {
    if (
      !closed(view, ["id", "path", "sha256", "pixelProvenance", "camera"]) ||
      typeof view.path !== "string" ||
      !view.path ||
      typeof view.sha256 !== "string" ||
      !/^[0-9a-f]{64}$/.test(view.sha256) ||
      typeof view.pixelProvenance !== "string" ||
      !view.pixelProvenance.trim()
    )
      throw new Error(
        "Every map image requires closed path/hash/provenance/calibration metadata",
      );
    const image: Buffer = readAutoMovieRecoveryBoundedFile(
      path.resolve(path.dirname(inputPath), view.path),
      maxInputBytes,
    );
    if (createHash("sha256").update(image).digest("hex") !== view.sha256)
      throw new Error(`Fixed camera image hash mismatch: ${view.id}`);
    const decoded: ReturnType<typeof decodeAutoMoviePpmImage> =
      decodeAutoMoviePpmImage(image, {
        maxPixels: spec.capture.budget.maxPixels - pixels,
        maxHeaderBytes: spec.maxHeaderBytes,
        transfer: "srgb",
      });
    pixels += decoded.width * decoded.height;
    views.push({
      id: view.id,
      sourceSha256: view.sha256,
      pixelProvenance: `${view.pixelProvenance}; host decoded fixed P6 sRGB RGB8 without orientation, crop, resize or rectification`,
      width: decoded.width,
      height: decoded.height,
      rgb8: decoded.rgb8,
      camera: view.camera,
    });
  }
  const outcome: ReturnType<typeof estimateAutoMovieRecoveryCameraMap> =
    estimateAutoMovieRecoveryCameraMap({ ...spec.capture, views });
  if (!("value" in outcome)) throw new Error(outcome.diagnostics.join("; "));
  writeAutoMovieRecoveryArtifact(outputPath, {
    schema: "automovie-recovery-camera-map-artifact-v1",
    command,
    sourceEpoch,
    inputSha256,
    operation: {
      operator: outcome.operator,
      status: outcome.status,
      diagnostics: outcome.diagnostics,
    },
    value: outcome.value,
    elapsedMs: performance.now() - started,
  });
}
