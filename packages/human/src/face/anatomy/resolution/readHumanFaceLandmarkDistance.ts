import { Vector3 } from "@automovie/engine";

import type { IHumanFaceMeasurementContext } from "./IHumanFaceMeasurementContext";
import type { IHumanFaceMeasurementGap } from "./IHumanFaceMeasurementGap";
import { readHumanFaceMeasurementLandmark } from "./readHumanFaceMeasurementLandmark";

/**
 * Straight-line distance between two named skin landmarks on the build's
 * final surface, in millimetres.
 *
 * This is the direct (caliper) distance of the 3D anthropometric protocols,
 * not a surface arc. Either landmark missing returns that landmark's gap.
 *
 * @author Samchon
 */
export function readHumanFaceLandmarkDistance(
  context: IHumanFaceMeasurementContext,
  from: string,
  to: string,
): number | IHumanFaceMeasurementGap {
  const a = readHumanFaceMeasurementLandmark(context, from);
  if ("reason" in a) return a;
  const b = readHumanFaceMeasurementLandmark(context, to);
  if ("reason" in b) return b;
  return Vector3.length(Vector3.subtract(a, b)) * 1000;
}
