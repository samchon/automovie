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
 * @author Samchon
 */
export function readHumanFaceMeasurementLandmark(
  context: IHumanFaceMeasurementContext,
  name: string,
): IAutoMovieVector3 | IHumanFaceMeasurementGap {
  const landmark = findHumanSkinLandmark(context.basis, name);
  const surface =
    landmark === undefined
      ? undefined
      : context.basis.surfaces[landmark.surface];
  if (landmark === undefined || surface === undefined)
    return { reason: `missing landmark: ${name}` };
  return context.point(surface.id, landmark.vertex);
}
