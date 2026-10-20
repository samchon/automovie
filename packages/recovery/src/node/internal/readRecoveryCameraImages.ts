import { decodeAutoMoviePpmImage } from "@automovie/ingest/ppm";
import type { IAutoMovieRecoveryCameraView } from "@automovie/interface/recovery";
import { createHash } from "node:crypto";
import path from "node:path";

import type { IAutoMovieRecoveryCameraFile } from "../../structures/image/IAutoMovieRecoveryCameraFile";
import { readAutoMovieRecoveryBoundedFile } from "./readAutoMovieRecoveryBoundedFile";

/**
 * Acquire a bounded fixed camera set without changing its supplied pixel chart.
 *
 * @evidence contracts/common.md#principled-implementation Closed path/hash/provenance metadata, complete-byte SHA verification and explicit P6 sRGB decoding bind every acquired source. Remaining aggregate pixels are checked by the decoder before each raster allocation.
 * @evidence contracts/common.md#clear-and-simple-design Shared Node acquisition serves map/scene commands while resident operations own calibration admission, observation and geometry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No unverified byte, directory scan, transform/codec fallback, environment alias or truth camera supplies an image.
 * @evidence contracts/common.md#meaningful-documentation States manifest-relative paths, complete per-file byte/header limits, aggregate pixels and unchanged-chart provenance.
 * @evidence contracts/performance.md#efficient-algorithms N complete bounded reads/hashes cost O(B), decoding O(P); aggregate pixels bound retained RGB arrays. No geometric fitting or feature extraction occurs here.
 * @evidence contracts/performance.md#reuse-equivalent-work Each declared image is read and hashed once; the same decoded array transfers to the public operation without an intermediate file or new decode.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Bounded readers close their descriptors synchronously; call-owned encoded buffers expire per iteration and decoded rasters transfer to the enclosing host. Throws retain no staging or external handle.
 */
export function readRecoveryCameraImages(
  sources: readonly IAutoMovieRecoveryCameraFile[],
  manifestPath: string,
  maxInputBytes: number,
  maxPixels: number,
  maxHeaderBytes: number,
): IAutoMovieRecoveryCameraView[] {
  const views: IAutoMovieRecoveryCameraView[] = [];
  let pixels: number = 0;
  for (const view of sources) {
    const keys: readonly string[] = [
      "id",
      "path",
      "sha256",
      "pixelProvenance",
      "camera",
    ];
    if (
      !view ||
      typeof view !== "object" ||
      Array.isArray(view) ||
      Reflect.ownKeys(view).length !== keys.length ||
      Reflect.ownKeys(view).some(
        (key: string | symbol): boolean =>
          typeof key !== "string" || !keys.includes(key),
      ) ||
      typeof view.path !== "string" ||
      !view.path ||
      typeof view.sha256 !== "string" ||
      !/^[0-9a-f]{64}$/.test(view.sha256) ||
      typeof view.pixelProvenance !== "string" ||
      !view.pixelProvenance.trim()
    )
      throw new Error(
        "Every camera image requires closed path/hash/provenance/calibration metadata",
      );
    const image: Buffer = readAutoMovieRecoveryBoundedFile(
      path.resolve(path.dirname(manifestPath), view.path),
      maxInputBytes,
    );
    if (createHash("sha256").update(image).digest("hex") !== view.sha256)
      throw new Error(`Fixed camera image hash mismatch: ${view.id}`);
    const decoded: ReturnType<typeof decodeAutoMoviePpmImage> =
      decodeAutoMoviePpmImage(image, {
        maxPixels: maxPixels - pixels,
        maxHeaderBytes,
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
  return views;
}
