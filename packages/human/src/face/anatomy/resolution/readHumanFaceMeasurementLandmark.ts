import type { IAutoMovieVector3 } from "@automovie/interface";

import { findHumanSkinLandmark } from "../../../common/basis/findHumanSkinLandmark";
import type { IHumanFaceMeasurementContext } from "./IHumanFaceMeasurementContext";
import type { IHumanFaceMeasurementGap } from "./IHumanFaceMeasurementGap";

/**
 * One named skin landmark of the basis, read on the build's final surface.
 *
 * The basis `skinLandmarks` record names the surface ordinal and vertex; the
 * point comes from the context, so it is the final posed Float32 position. A
 * landmark the basis does not declare returns a gap naming it, never a
 * nearby vertex.
 *
 * @evidence contracts/common.md#principled-implementation Landmarks are read through the basis's own named registration on the final surface.
 * @evidence contracts/common.md#clear-and-simple-design One lookup shared by every face measurement that reads a named point.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A missing landmark is a named gap; no vertex number or nearest-point guess replaces it.
 * @evidence contracts/common.md#meaningful-documentation States the registration it reads, the stage of the point and the gap.
 * @evidence contracts/modeling.md#spatial-conventions The point is metres in the basis head frame, rounded to Float32.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The lookup names no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The lookup is not a channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The lookup emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The lookup builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation Measurements report what it reads.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The basis producer owns the landmark's anatomical definition.
 * @evidenceExclude contracts/anatomy.md#permitted-range The lookup bounds no value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The lookup is not an input.
 * @author Samchon
 */
export function readHumanFaceMeasurementLandmark(
  context: IHumanFaceMeasurementContext,
  name: string,
): IAutoMovieVector3 | IHumanFaceMeasurementGap {
  const landmark = findHumanSkinLandmark(context.basis, name);
  const surface =
    landmark === undefined ? undefined : context.basis.surfaces[landmark.surface];
  if (landmark === undefined || surface === undefined)
    return { reason: `missing landmark: ${name}` };
  return context.point(surface.id, landmark.vertex);
}
