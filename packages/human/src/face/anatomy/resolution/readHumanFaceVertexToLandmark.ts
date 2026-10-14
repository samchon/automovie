import type { IAutoMovieHumanFaceBasisSurface as ImportedIAutoMovieHumanFaceBasisSurface } from "@automovie/human";
import type { IAutoMovieVector3 as ImportedIAutoMovieVector3 } from "@automovie/interface";

import type { IHumanFaceMeasurementContext } from "./IHumanFaceMeasurementContext";
import type { IHumanFaceMeasurementGap } from "./IHumanFaceMeasurementGap";
import { readHumanFaceMeasurementLandmark } from "./readHumanFaceMeasurementLandmark";

/**
 * The straight distance from the vertex (the highest point of the skin surface, head in the Frankfurt plane) to a named skin landmark on the build's final surface, in millimetres. The basis rest orientation stands in for the Frankfurt plane (+Y up), and the skin carries no hair, so its top is the hair-excluded vertex. The vertex is found on each build, never fixed. A missing landmark returns its gap.
 *
 * @evidence contracts/common.md#principled-implementation A registered landmark's source surface supplies the current maximum-head-Y skin vertex for straight separation.
 * @evidence contracts/common.md#clear-and-simple-design The exact landmark registration determines both the endpoint and source surface.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Head-axis orientation substitutes for a separately acquired Frankfurt plane; empty/nonfinite source results are classified by report assembly.
 * @evidence contracts/common.md#meaningful-documentation The straight skin-to-landmark separation converts metres to millimetres and excludes hair geometry.
 * @evidence contracts/performance.md#efficient-algorithms Current surface acquisition and maximum-Y traversal are linear in source vertices.
 * @evidence contracts/performance.md#reuse-equivalent-work The same context supplies the landmark and posed skin instead of a rest-shape height proxy.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Copied surface arrays are temporary and only the scalar/gap escapes.
 *
 * @author Samchon
 */
export function readHumanFaceVertexToLandmark(
  context: IHumanFaceMeasurementContext,
  landmark: string,
): number | IHumanFaceMeasurementGap {
  const point: ImportedIAutoMovieVector3 | IHumanFaceMeasurementGap =
    readHumanFaceMeasurementLandmark(context, landmark);
  if ("reason" in point) return point;
  const surface: ImportedIAutoMovieHumanFaceBasisSurface =
    context.basis.surfaces[context.basis.skinLandmarks![landmark].surface];
  const positions: readonly number[] = context.surface(surface.id).positions;
  let top: number = 0;
  for (let v: number = 1; v < positions.length / 3; v++)
    if (positions[v * 3 + 1] > positions[top * 3 + 1]) top = v;
  return (
    Math.hypot(
      positions[top * 3] - point.x,
      positions[top * 3 + 1] - point.y,
      positions[top * 3 + 2] - point.z,
    ) * 1000
  );
}
