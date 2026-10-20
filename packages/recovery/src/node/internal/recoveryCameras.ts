import { decodeAutoMoviePpmImage } from "@automovie/ingest/ppm";
import type { IAutoMovieRecoveryCameraPairInput } from "@automovie/interface/recovery";
import { createHash } from "node:crypto";
import path from "node:path";

import { estimateAutoMovieRecoveryCameraPair } from "../../observation/estimateAutoMovieRecoveryCameraPair";
import type { IAutoMovieRecoveryCameraFiles } from "../../structures/image/IAutoMovieRecoveryCameraFiles";
import { readAutoMovieRecoveryBoundedFile } from "./readAutoMovieRecoveryBoundedFile";
import { writeAutoMovieRecoveryArtifact } from "../artifact/writeAutoMovieRecoveryArtifact";

/**
 * Run the installed automatic calibrated camera-pair estimator on fixed files.
 * estimate consumes a versioned two-image manifest and publishes one new JSON
 * evidence artifact. Completed observations may refuse a camera; the artifact's
 * status and reasons remain authoritative even when the command completes.
 *
 * @evidence contracts/common.md#principled-implementation Bounded complete-byte reads, SHA-256 verification and explicit sRGB P6 decoding precede the public resident camera operation. Supplied calibration and declared prior pixel history stay assertions, while this host verifies the exact files it actually acquired.
 * @evidence contracts/common.md#clear-and-simple-design The Node command owns explicit paths, codec dispatch, input/source provenance and immutable publication; the resident operation owns feature observation, camera fitting and qualification without filesystem access.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No source directory scan, unverified image, format fallback, synthetic camera, trained feature, changed budget or overwrite supplies a result. A cancelled/refused/failed resident operation without a value publishes nothing.
 * @evidence contracts/common.md#meaningful-documentation Gives command arguments, per-file byte bound, unchanged decoding chart, prior-history assertion, source epoch and computational completion versus conditional camera status.
 * @evidence contracts/performance.md#efficient-algorithms Two bounded sources require O(B) reading/hashing and O(P) raster copying before the resident operation's explicit numerical budgets. Aggregate pixel admission is decremented before each decoder allocation; JSON serialization costs O(O) in its bounded sparse observation artifact.
 * @evidence contracts/performance.md#reuse-equivalent-work Every source is read and hashed once, and one public operation supplies the complete artifact. Source/input digests and source epoch identify publication without sharing or resuming an effectful command.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Bounded readers close descriptors synchronously; at most two decoded arrays accumulate under the aggregate pixel limit and expire after estimation. The atomic artifact writer exclusively owns and cleans staging; no resident image buffer enters the JSON value.
 */
export function recoveryCameras(args: string[], sourceEpoch: string): void {
  const [command, inputPath, outputPath, byteText]: string[] = args;
  const maxInputBytes: number = Number(byteText);
  if (
    args.length !== 4 ||
    command !== "estimate" ||
    !inputPath ||
    !outputPath ||
    !Number.isSafeInteger(maxInputBytes) ||
    maxInputBytes < 1
  )
    throw new Error(
      "Usage: cameras estimate input.json new-output.json maxInputBytes",
    );
  const bytes: Buffer = readAutoMovieRecoveryBoundedFile(
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
    !Number.isSafeInteger(spec.capture.budget.maxPixels) ||
    spec.capture.budget.maxPixels < 1 ||
    !Number.isSafeInteger(spec.maxHeaderBytes) ||
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
  const outcome: ReturnType<typeof estimateAutoMovieRecoveryCameraPair> =
    estimateAutoMovieRecoveryCameraPair({ ...spec.capture, views });
  if (!("value" in outcome)) throw new Error(outcome.diagnostics.join("; "));
  writeAutoMovieRecoveryArtifact(outputPath, {
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
