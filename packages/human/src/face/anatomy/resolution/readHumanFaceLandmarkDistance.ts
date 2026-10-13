import type { IAutoMovieVector3 as ImportedIAutoMovieVector3 } from "@automovie/interface";
import { Vector3 } from "@automovie/engine";

import type { IHumanFaceMeasurementContext } from "./IHumanFaceMeasurementContext";
import type { IHumanFaceMeasurementGap } from "./IHumanFaceMeasurementGap";
import { readHumanFaceMeasurementLandmark } from "./readHumanFaceMeasurementLandmark";

/**
 * Straight-line distance between two named skin landmarks on the build's final surface, in millimetres.
 *
 * This is the direct (caliper) distance of the 3D anthropometric protocols, not a surface arc. Either landmark missing returns that landmark's gap.
 *
 * @evidence contracts/common.md#principled-implementation Two named current registered points supply Euclidean separation.
 * @evidence contracts/common.md#clear-and-simple-design Registration and current point acquisition delegate to the common landmark reader.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A missing landmark stays a gap; this straight distance is not a surface arc or clinical acquisition protocol.
 * @evidence contracts/common.md#meaningful-documentation Head-metre separation converts once to millimetres.
 * @evidence contracts/performance.md#efficient-algorithms Two point reads and a fixed norm determine work.
 * @evidence contracts/performance.md#reuse-equivalent-work Existing current context is reused without rebuilding shape or substituting requested measurements.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the scalar/gap escapes and no landmark geometry cache is retained.
 *
 * @author Samchon
 */
export function readHumanFaceLandmarkDistance(
  context: IHumanFaceMeasurementContext,
  from: string,
  to: string,
): number | IHumanFaceMeasurementGap {
  const a: ImportedIAutoMovieVector3 | IHumanFaceMeasurementGap = readHumanFaceMeasurementLandmark(context, from);
  if ("reason" in a) return a;
  const b: ImportedIAutoMovieVector3 | IHumanFaceMeasurementGap = readHumanFaceMeasurementLandmark(context, to);
  if ("reason" in b) return b;
  return Vector3.length(Vector3.subtract(a, b)) * 1000;
}
