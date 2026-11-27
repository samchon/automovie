import type { IAutoMovieRecoveryCameraSceneFiles } from "@automovie/interface";
import { AutoMovieRecoveryObservation } from "@automovie/recovery";
import { createHash } from "node:crypto";

import { writeRecoveryArtifact } from "../artifact/writeRecoveryArtifact";
import { readRecoveryBoundedFile } from "./readRecoveryBoundedFile";
import { readRecoveryCameraImages } from "./readRecoveryCameraImages";

/*
 * Publish one immutable scene artifact from a bounded fixed camera manifest.
 * Usage is cameras scene input.json new-output.json maxInputBytes. A completed
 * partial/refused geometric component has evidence; a no-value operation does
 * not publish an artifact. This host invokes the same public RGB operation.
 */
export function recoveryCameraScene(args: string[], sourceEpoch: string): void {
  const [command, inputPath, outputPath, byteText]: string[] = args;
  const maxInputBytes: number = Number(byteText);
  if (
    args.length !== 4 ||
    command !== "scene" ||
    !inputPath ||
    !outputPath ||
    maxInputBytes < 1
  )
    throw new Error(
      "Usage: cameras scene input.json new-output.json maxInputBytes",
    );
  const bytes: Buffer = readRecoveryBoundedFile(
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
    spec.capture.budget.maxPixels < 1 ||
    spec.capture.budget.maxViews < 3 ||
    spec.maxHeaderBytes < 1 ||
    !Array.isArray(spec.views) ||
    spec.views.length < 3 ||
    spec.views.length > spec.capture.budget.maxViews
  )
    throw new Error(
      "A closed bounded camera-scene manifest with explicit view/pixel/header limits is required",
    );
  const started: number = performance.now();
  const outcome: ReturnType<typeof AutoMovieRecoveryObservation.estimateCameraScene> =
    AutoMovieRecoveryObservation.estimateCameraScene({
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
  writeRecoveryArtifact(outputPath, {
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
