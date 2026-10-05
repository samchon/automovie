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
 * @evidence contracts/common.md#principled-implementation The vertex is the skin's own highest point on each build.
 * @evidence contracts/common.md#clear-and-simple-design One landmark read and one pass over the skin.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A missing landmark returns its gap.
 * @evidence contracts/common.md#meaningful-documentation States the vertex definition, both approximations and the gap.
 * @evidence contracts/modeling.md#spatial-conventions Millimetres in the basis head frame.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The registered measurement states its protocol.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The reader names no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The reader is not a channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The reader emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The reader builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation Measurements report what it reads.
 * @evidenceExclude contracts/anatomy.md#permitted-range The reader bounds no value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The reader is not an input.
 * @author Samchon
 */
export function readHumanFaceVertexToLandmark(
  context: IHumanFaceMeasurementContext,
  landmark: string,
): number | IHumanFaceMeasurementGap {
  const point = readHumanFaceMeasurementLandmark(context, landmark);
  if ("reason" in point) return point;
  const surface = context.basis.surfaces[context.basis.skinLandmarks![landmark].surface];
  const positions = context.surface(surface.id).positions;
  let top = 0;
  for (let v = 1; v < positions.length / 3; v++) if (positions[v * 3 + 1] > positions[top * 3 + 1]) top = v;
  return Math.hypot(positions[top * 3] - point.x, positions[top * 3 + 1] - point.y, positions[top * 3 + 2] - point.z) * 1000;
}
