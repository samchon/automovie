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
 * @evidence contracts/common.md#principled-implementation The angle is read on the same final surface as every face measurement.
 * @evidence contracts/common.md#clear-and-simple-design Three landmark reads and one angle.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A missing landmark returns its gap; no nearby point stands in.
 * @evidence contracts/common.md#meaningful-documentation States the vertex convention, the unit and the gap.
 * @evidence contracts/modeling.md#spatial-conventions Degrees between directions in the basis head frame.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Each registered measurement states its protocol.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The reader names no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The reader is not a channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The reader emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The reader builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation Measurements report what it reads.
 * @evidenceExclude contracts/anatomy.md#permitted-range The reader bounds no value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The reader is not an input.
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
