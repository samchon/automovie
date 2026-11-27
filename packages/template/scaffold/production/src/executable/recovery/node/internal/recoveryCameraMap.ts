import type {
  IAutoMovieRecoveryCameraMapFiles,
  IAutoMovieRecoveryCameraMapInput,
} from "@automovie/interface";
import { AutoMovieRecoveryObservation } from "@automovie/recovery";
import { createHash } from "node:crypto";

import { writeRecoveryArtifact } from "../artifact/writeRecoveryArtifact";
import { readRecoveryBoundedFile } from "./readRecoveryBoundedFile";
import { readRecoveryCameraImages } from "./readRecoveryCameraImages";

/**
 * Acquire fixed three-image bytes and publish one immutable sparse-map
 * artifact. The command is cameras map input.json new-output.json
 * maxInputBytes. Completed seed-only/refused geometry still has an artifact; a
 * no-value failure has none.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Bounded complete reads and SHA checks precede explicit unchanged-chart sRGB P6 decoding. One public resident map operation supplies geometry, and immutable publication preserves source epoch, manifest identity and authoritative stage qualification. No source scan, unverified image, transform fallback, truth camera, inferred calibration, changed numerical threshold, overwrite or installation supplies a result.
 * @evidence contracts/development/implementation.md#efficient-algorithms This Node owner handles paths, byte provenance, decoding and publication; resident recovery owns automatic observation, track geometry and policy. Three bounded reads/hashes cost O(B), decoding O(P), followed by the public map's explicit work limits. Remaining aggregate pixels are decremented before each raster allocation; serialization scales with the bounded sparse artifact. Each declared source is acquired/hashed once; a single public operation supplies the artifact with unchanged metadata, and there is no repeated geometry or effect cache. Bounded readers close their own descriptors; at most three rasters accumulate under the aggregate ceiling and expire after estimation. The existing atomic writer owns staging cleanup and no RGB enters the published JSON.
 * @evidence contracts/development/common.md#meaningful-documentation States command arguments, relative paths, per-file and aggregate pixel limits, source epoch, unchanged chart and computation versus accepted map semantics.
 */
export function recoveryCameraMap(args: string[], sourceEpoch: string): void {
  const [command, inputPath, outputPath, byteText]: string[] = args;
  const maxInputBytes: number = Number(byteText);
  if (
    args.length !== 4 ||
    command !== "map" ||
    !inputPath ||
    !outputPath ||
    maxInputBytes < 1
  )
    throw new Error(
      "Usage: cameras map input.json new-output.json maxInputBytes",
    );
  const bytes: Buffer = readRecoveryBoundedFile(
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
    spec.capture.budget.maxPixels < 1 ||
    spec.maxHeaderBytes < 1 ||
    !Array.isArray(spec.views) ||
    spec.views.length !== 3
  )
    throw new Error(
      "A closed three-image camera-map manifest with explicit pixel/header budgets is required",
    );
  const started: number = performance.now();
  const views: IAutoMovieRecoveryCameraMapInput["views"] =
    readRecoveryCameraImages(
      spec.views,
      inputPath,
      maxInputBytes,
      spec.capture.budget.maxPixels,
      spec.maxHeaderBytes,
    );
  const outcome: ReturnType<typeof AutoMovieRecoveryObservation.estimateCameraMap> =
    AutoMovieRecoveryObservation.estimateCameraMap({ ...spec.capture, views });
  if (!("value" in outcome)) throw new Error(outcome.diagnostics.join("; "));
  writeRecoveryArtifact(outputPath, {
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
