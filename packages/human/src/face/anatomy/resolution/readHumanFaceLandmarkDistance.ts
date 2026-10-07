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
 * @evidence contracts/common.md#principled-implementation A caliper distance between two registered points on the final surface is the protocol's own definition.
 * @evidence contracts/common.md#clear-and-simple-design One reader shared by every point-to-point face measurement.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A missing landmark propagates as a gap, never a guessed distance.
 * @evidence contracts/common.md#meaningful-documentation States the distance kind, unit and gap.
 * @evidence contracts/modeling.md#spatial-conventions Millimetres from metre positions in the basis head frame.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The reader names no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The reader is not a channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The reader emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The reader builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation Measurements report what it reads.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Each measurement names its own protocol.
 * @evidenceExclude contracts/anatomy.md#permitted-range The reader bounds no value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The reader is not an input.
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
