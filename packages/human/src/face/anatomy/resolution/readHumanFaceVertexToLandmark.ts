import type { IHumanFaceMeasurementContext } from "./IHumanFaceMeasurementContext";
import type { IHumanFaceMeasurementGap } from "./IHumanFaceMeasurementGap";
import { readHumanFaceMeasurementLandmark } from "./readHumanFaceMeasurementLandmark";

/**
 * The straight distance from the vertex (the highest point of the skin
 * surface, head in the Frankfurt plane) to a named skin landmark on the
 * build's final surface, in millimetres. The basis rest orientation stands in
 * for the Frankfurt plane (+Y up), and the skin carries no hair, so its top is
 * the hair-excluded vertex. The vertex is found on each build, never fixed. A
 * missing landmark returns its gap.
 *
 * @author Samchon
 */
export function readHumanFaceVertexToLandmark(
  context: IHumanFaceMeasurementContext,
  landmark: string,
): number | IHumanFaceMeasurementGap {
  const point = readHumanFaceMeasurementLandmark(context, landmark);
  if ("reason" in point) return point;
  const surface =
    context.basis.surfaces[context.basis.skinLandmarks![landmark].surface];
  const positions = context.surface(surface.id).positions;
  let top = 0;
  for (let v = 1; v < positions.length / 3; v++)
    if (positions[v * 3 + 1] > positions[top * 3 + 1]) top = v;
  return (
    Math.hypot(
      positions[top * 3] - point.x,
      positions[top * 3 + 1] - point.y,
      positions[top * 3 + 2] - point.z,
    ) * 1000
  );
}
