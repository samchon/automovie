import type { IAutoMovieHumanSkinLandmark as ImportedIAutoMovieHumanSkinLandmark, IAutoMovieHumanFaceBasisSurface as ImportedIAutoMovieHumanFaceBasisSurface } from "@automovie/human";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { findHumanSkinLandmark } from "../../../common/basis/findHumanSkinLandmark";
import type { IHumanFaceMeasurementContext } from "./IHumanFaceMeasurementContext";
import type { IHumanFaceMeasurementGap } from "./IHumanFaceMeasurementGap";

/**
 * One named skin landmark of the basis, read on the build's final surface.
 *
 * The basis `skinLandmarks` record names the surface ordinal and vertex; the point comes from the context, so it is the final posed Float32 position. A landmark the basis does not declare returns a gap naming it, never a nearby vertex.
 *
 * @evidence contracts/common.md#principled-implementation An exact own registered landmark key selects one current source vertex.
 * @evidence contracts/common.md#clear-and-simple-design The shared registration lookup and context point seam separate naming from posed coordinate acquisition.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unknown keys or unavailable surfaces return explicit gaps; no nearby vertex or rest coordinate is inferred.
 * @evidence contracts/common.md#meaningful-documentation The returned coordinate uses current head-frame metres.
 * @evidence contracts/performance.md#efficient-algorithms Exact-key lookup and one current point read determine work.
 * @evidence contracts/performance.md#reuse-equivalent-work The same landmark reader supports distance, angle and dental instruments.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned point is caller-owned; basis and source arrays remain borrowed through the context.
 *
 * @author Samchon
 */
export function readHumanFaceMeasurementLandmark(
  context: IHumanFaceMeasurementContext,
  name: string,
): IAutoMovieVector3 | IHumanFaceMeasurementGap {
  const landmark: ImportedIAutoMovieHumanSkinLandmark | undefined = findHumanSkinLandmark(context.basis, name);
  const surface: ImportedIAutoMovieHumanFaceBasisSurface | undefined =
    landmark === undefined
      ? undefined
      : context.basis.surfaces[landmark.surface];
  if (landmark === undefined || surface === undefined)
    return { reason: `missing landmark: ${name}` };
  return context.point(surface.id, landmark.vertex);
}
