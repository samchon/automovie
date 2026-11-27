import { AutoMovieIngestPpmImage } from "@automovie/ingest";
import type {
  IAutoMovieRecoveryCameraFile,
  IAutoMovieRecoveryCameraView,
} from "@automovie/interface";
import { createHash } from "node:crypto";
import path from "node:path";

import { readRecoveryBoundedFile } from "./readRecoveryBoundedFile";

/*
 * Acquire a bounded fixed camera set without changing its supplied pixel chart.
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
    const image: Buffer = readRecoveryBoundedFile(
      path.resolve(path.dirname(manifestPath), view.path),
      maxInputBytes,
    );
    if (createHash("sha256").update(image).digest("hex") !== view.sha256)
      throw new Error(`Fixed camera image hash mismatch: ${view.id}`);
    const decoded: ReturnType<typeof AutoMovieIngestPpmImage.decode> =
      AutoMovieIngestPpmImage.decode(image, {
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
