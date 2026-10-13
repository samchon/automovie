import type { IAutoMovieVector3 as ImportedIAutoMovieVector3 } from "@automovie/interface";
import { Vector3 } from "@automovie/engine";

import type { IHumanFaceMeasurementContext } from "./IHumanFaceMeasurementContext";
import type { IHumanFaceMeasurementGap } from "./IHumanFaceMeasurementGap";
import { readHumanFaceMeasurementLandmark } from "./readHumanFaceMeasurementLandmark";

/**
 * The 3D angle at a named skin landmark between two others on the build's final surface, in degrees: the landmark angle of the 3D anthropometric protocols (for example glabella–nasion–pronasale, vertex at nasion). Any landmark missing returns that landmark's gap.
 *
 * @evidence contracts/common.md#principled-implementation Three registered current points supply the dot-product angle with a clamped cosine.
 * @evidence contracts/common.md#clear-and-simple-design The landmark reader owns registration failures and this instrument owns degree conversion.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Coincident vectors can produce NaN; report assembly classifies nonfinite results as unavailable rather than proving a clinical angle.
 * @evidence contracts/common.md#meaningful-documentation The angle uses straight point vectors in current head space and returns degrees.
 * @evidence contracts/performance.md#efficient-algorithms Three point reads and fixed vector arithmetic determine work.
 * @evidence contracts/performance.md#reuse-equivalent-work Shared registered point acquisition keeps angle and distance instruments on the same posed source.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary points/vectors are per-call and only a scalar or registration gap escapes.
 *
 * @author Samchon
 */
export function readHumanFaceLandmarkAngle(
  context: IHumanFaceMeasurementContext,
  from: string,
  vertex: string,
  to: string,
): number | IHumanFaceMeasurementGap {
  const a: ImportedIAutoMovieVector3 | IHumanFaceMeasurementGap = readHumanFaceMeasurementLandmark(context, from);
  if ("reason" in a) return a;
  const b: ImportedIAutoMovieVector3 | IHumanFaceMeasurementGap = readHumanFaceMeasurementLandmark(context, vertex);
  if ("reason" in b) return b;
  const c: ImportedIAutoMovieVector3 | IHumanFaceMeasurementGap = readHumanFaceMeasurementLandmark(context, to);
  if ("reason" in c) return c;
  const u: ImportedIAutoMovieVector3 = Vector3.subtract(a, b);
  const w: ImportedIAutoMovieVector3 = Vector3.subtract(c, b);
  const cosine: number = Vector3.dot(u, w) / (Vector3.length(u) * Vector3.length(w));
  return (Math.acos(Math.min(1, Math.max(-1, cosine))) * 180) / Math.PI;
}
