import { createHash } from "node:crypto";

import { estimateAutoMovieRecoveryCameraScene } from "../../observation/estimateAutoMovieRecoveryCameraScene";
import type { IAutoMovieRecoveryCameraSceneFiles } from "../../structures/image/IAutoMovieRecoveryCameraSceneFiles";
import { writeAutoMovieRecoveryArtifact } from "../artifact/writeAutoMovieRecoveryArtifact";
import { readAutoMovieRecoveryBoundedFile } from "./readAutoMovieRecoveryBoundedFile";
import { readRecoveryCameraImages } from "./readRecoveryCameraImages";

/**
 * Publish one immutable scene artifact from a bounded fixed camera manifest.
 * Usage is cameras scene input.json new-output.json maxInputBytes. A completed
 * partial/refused geometric component has evidence; a no-value operation does
 * not publish an artifact. This host invokes the same public RGB operation.
 *
 * @evidence contracts/common.md#principled-implementation Closed source/work metadata and bounded complete-byte acquisition precede unchanged-chart decoding. The resident scene operation owns registration, point growth and joint qualification; the shared immutable writer owns final publication.
 * @evidence contracts/common.md#clear-and-simple-design This Node owner handles paths, bytes, provenance and publication while all camera/point algorithms remain in resident recovery.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No private observation injection, source scan, inferred camera, truth pose, changed policy, overwrite or installation supplies a result.
 * @evidence contracts/common.md#meaningful-documentation States command arguments, per-source and aggregate limits, explicit source epoch and computation versus registered-component coverage.
 * @evidence contracts/performance.md#efficient-algorithms N bounded file reads/hashes and O(P) decoding precede the resident operation's admitted feature, matching and aggregate scene work. View count and aggregate pixels are checked before retention grows.
 * @evidence contracts/performance.md#reuse-equivalent-work Each fixed image is acquired once and one public call supplies one complete artifact; no geometry or effectful command is repeated.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Bounded file descriptors close synchronously, decoded rasters expire after the resident operation, and the shared atomic writer cleans staging on failure. No RGB or descriptor enters JSON output.
 */
export function recoveryCameraScene(args: string[], sourceEpoch: string): void {
  const [command, inputPath, outputPath, byteText]: string[] = args;
  const maxInputBytes: number = Number(byteText);
  if (
    args.length !== 4 ||
    command !== "scene" ||
    !inputPath ||
    !outputPath ||
    !Number.isSafeInteger(maxInputBytes) ||
    maxInputBytes < 1
  )
    throw new Error(
      "Usage: cameras scene input.json new-output.json maxInputBytes",
    );
  const bytes: Buffer = readAutoMovieRecoveryBoundedFile(
    inputPath,
    maxInputBytes,
  );
  const inputSha256: string = createHash("sha256").update(bytes).digest("hex");
  const spec: IAutoMovieRecoveryCameraSceneFiles = JSON.parse(
    bytes.toString("utf8"),
  ) as IAutoMovieRecoveryCameraSceneFiles;
  const closed: (value: object, keys: readonly string[]) => boolean = (
    value: object,
    keys: readonly string[],
  ): boolean =>
    !!value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Reflect.ownKeys(value).length === keys.length &&
    Reflect.ownKeys(value).every(
      (key: string | symbol): boolean =>
        typeof key === "string" && keys.includes(key),
    );
  if (
    !closed(spec, [
      "schema",
      "encoding",
      "capture",
      "maxHeaderBytes",
      "views",
    ]) ||
    spec.schema !== "automovie-recovery-camera-scene-files-v1" ||
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
    !Number.isSafeInteger(spec.capture.budget.maxViews) ||
    spec.capture.budget.maxViews < 3 ||
    !Number.isSafeInteger(spec.maxHeaderBytes) ||
    spec.maxHeaderBytes < 1 ||
    !Array.isArray(spec.views) ||
    spec.views.length < 3 ||
    spec.views.length > spec.capture.budget.maxViews
  )
    throw new Error(
      "A closed bounded camera-scene manifest with explicit view/pixel/header limits is required",
    );
  const started: number = performance.now();
  const outcome: ReturnType<typeof estimateAutoMovieRecoveryCameraScene> =
    estimateAutoMovieRecoveryCameraScene({
      ...spec.capture,
      views: readRecoveryCameraImages(
        spec.views,
        inputPath,
        maxInputBytes,
        spec.capture.budget.maxPixels,
        spec.maxHeaderBytes,
      ),
    });
  if (!("value" in outcome)) throw new Error(outcome.diagnostics.join("; "));
  writeAutoMovieRecoveryArtifact(outputPath, {
    schema: "automovie-recovery-camera-scene-artifact-v1",
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
