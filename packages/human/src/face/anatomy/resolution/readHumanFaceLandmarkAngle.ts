import { Vector3 } from "@automovie/engine";

import type { IHumanFaceMeasurementContext } from "./IHumanFaceMeasurementContext";
import type { IHumanFaceMeasurementGap } from "./IHumanFaceMeasurementGap";
import { readHumanFaceMeasurementLandmark } from "./readHumanFaceMeasurementLandmark";

/**
 * The 3D angle at a named skin landmark between two others on the build's
 * final surface, in degrees: the landmark angle of the 3D anthropometric
 * protocols (for example glabella–nasion–pronasale, vertex at nasion). Any
 * landmark missing returns that landmark's gap.
 *
 * @author Samchon
 */
export function readHumanFaceLandmarkAngle(
  context: IHumanFaceMeasurementContext,
  from: string,
  vertex: string,
  to: string,
): number | IHumanFaceMeasurementGap {
  const a = readHumanFaceMeasurementLandmark(context, from);
  if ("reason" in a) return a;
  const b = readHumanFaceMeasurementLandmark(context, vertex);
  if ("reason" in b) return b;
  const c = readHumanFaceMeasurementLandmark(context, to);
  if ("reason" in c) return c;
  const u = Vector3.subtract(a, b);
  const w = Vector3.subtract(c, b);
  const cosine = Vector3.dot(u, w) / (Vector3.length(u) * Vector3.length(w));
  return (Math.acos(Math.min(1, Math.max(-1, cosine))) * 180) / Math.PI;
}
