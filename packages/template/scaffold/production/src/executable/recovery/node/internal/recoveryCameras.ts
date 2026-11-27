import { AutoMovieIngestPpmImage } from "@automovie/ingest";
import type {
  IAutoMovieRecoveryCameraFiles,
  IAutoMovieRecoveryCameraPairInput,
} from "@automovie/interface";
import { AutoMovieRecoveryObservation } from "@automovie/recovery";
import { createHash } from "node:crypto";
import path from "node:path";

import { writeRecoveryArtifact } from "../artifact/writeRecoveryArtifact";
import { readRecoveryBoundedFile } from "./readRecoveryBoundedFile";
import { recoveryCameraMap } from "./recoveryCameraMap";
import { recoveryCameraScene } from "./recoveryCameraScene";

/*
 * Dispatch map/scene acquisition or run the calibrated pair estimator on files.
 * estimate consumes a versioned two-image manifest and publishes one new JSON
 * evidence artifact. Completed observations may refuse a camera; the artifact's
 * status and reasons remain authoritative even when the command completes.
 */
export function recoveryCameras(args: string[], sourceEpoch: string): void {
  if (args[0] === "scene") {
    recoveryCameraScene(args, sourceEpoch);
    return;
  }
  if (args[0] === "map") {
    recoveryCameraMap(args, sourceEpoch);
    return;
  }
  const [command, inputPath, outputPath, byteText]: string[] = args;
  const maxInputBytes: number = Number(byteText);
  if (
    args.length !== 4 ||
    command !== "estimate" ||
    !inputPath ||
    !outputPath ||
    maxInputBytes < 1
  )
    throw new Error(
      "Usage: cameras estimate input.json new-output.json maxInputBytes",
    );
  const bytes: Buffer = readRecoveryBoundedFile(
    inputPath,
    maxInputBytes,
  );
  const inputSha256: string = createHash("sha256").update(bytes).digest("hex");
  const spec: IAutoMovieRecoveryCameraFiles = JSON.parse(
    bytes.toString("utf8"),
  ) as IAutoMovieRecoveryCameraFiles;
  if (
    !spec ||
    typeof spec !== "object" ||
    Array.isArray(spec) ||
    Object.keys(spec).length !== 5 ||
    Object.keys(spec).some(
      (key: string): boolean =>
        !["schema", "encoding", "capture", "maxHeaderBytes", "views"].includes(
          key,
        ),
    ) ||
    spec.schema !== "automovie-recovery-camera-files-v1" ||
    spec.encoding !== "ppm-srgb-rgb8-v1" ||
    !spec.capture ||
    typeof spec.capture !== "object" ||
    Array.isArray(spec.capture) ||
    Object.keys(spec.capture).length !== 6 ||
    Object.keys(spec.capture).some(
      (key: string): boolean =>
        ![
          "schema",
          "objectId",
          "rigidity",
          "cohort",
          "policy",
          "budget",
        ].includes(key),
    ) ||
    !spec.capture.budget ||
    spec.capture.budget.maxPixels < 1 ||
    spec.maxHeaderBytes < 1 ||
    !Array.isArray(spec.views) ||
    spec.views.length !== 2
  )
    throw new Error(
      "A closed fixed-byte camera-pair manifest with explicit pixel/header budgets is required",
    );
  const started: number = performance.now();
  const views: IAutoMovieRecoveryCameraPairInput["views"] = [];
  let pixels: number = 0;
  for (const view of spec.views) {
    if (
      !view ||
      typeof view !== "object" ||
      Array.isArray(view) ||
      Object.keys(view).length !== 5 ||
      Object.keys(view).some(
        (key: string): boolean =>
          !["id", "path", "sha256", "pixelProvenance", "camera"].includes(key),
      ) ||
      typeof view.path !== "string" ||
      !view.path ||
      typeof view.sha256 !== "string" ||
      !/^[0-9a-f]{64}$/.test(view.sha256) ||
      typeof view.pixelProvenance !== "string" ||
      !view.pixelProvenance.trim()
    )
      throw new Error(
        "Every camera image requires a closed path/hash/provenance/calibration record",
      );
    const image: Buffer = readRecoveryBoundedFile(
      path.resolve(path.dirname(inputPath), view.path),
      maxInputBytes,
    );
    if (createHash("sha256").update(image).digest("hex") !== view.sha256)
      throw new Error(`Fixed camera image hash mismatch: ${view.id}`);
    const decoded: ReturnType<typeof AutoMovieIngestPpmImage.decode> =
      AutoMovieIngestPpmImage.decode(image, {
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
  const outcome: ReturnType<typeof AutoMovieRecoveryObservation.estimateCameraPair> =
    AutoMovieRecoveryObservation.estimateCameraPair({ ...spec.capture, views });
  if (!("value" in outcome)) throw new Error(outcome.diagnostics.join("; "));
  writeRecoveryArtifact(outputPath, {
    schema: "automovie-recovery-camera-artifact-v1",
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
