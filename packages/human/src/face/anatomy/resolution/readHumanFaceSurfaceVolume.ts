import type { IHumanFaceMeasurementContext } from "./IHumanFaceMeasurementContext";
import type { IHumanFaceMeasurementGap } from "./IHumanFaceMeasurementGap";

/**
 * Enclosed volume of one closed basis surface on the build's final shape, in
 * cubic centimetres.
 *
 * The signed tetrahedra from the origin to every oriented triangle sum to the
 * enclosed volume when the surface is closed (every edge shared by exactly two
 * triangles). An open surface has no enclosed volume and returns a gap naming
 * its open edges. The volume is that of the modelled surface, whose extent is
 * the asset's, not a measured anatomical boundary.
 *
 * @evidence contracts/common.md#principled-implementation The divergence-theorem sum is exact for a closed oriented triangle surface and undefined for an open one, which refuses.
 * @evidence contracts/common.md#clear-and-simple-design One reader for any closed basis surface's volume.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An open surface is a named gap; no hole is capped to manufacture a volume.
 * @evidence contracts/common.md#meaningful-documentation States the formula, the closure requirement, the unit and that the extent is the asset's.
 * @evidence contracts/modeling.md#spatial-conventions Cubic centimetres from metre positions in the basis head frame.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The reader names no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The reader is not a channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The reader emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The reader builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation Measurements report what it reads.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The modelled surface's extent is the asset's; no anatomical volume is claimed.
 * @evidenceExclude contracts/anatomy.md#permitted-range The reader bounds no value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The reader is not an input.
 * @author Samchon
 */
export function readHumanFaceSurfaceVolume(
  context: IHumanFaceMeasurementContext,
  surfaceId: string,
): number | IHumanFaceMeasurementGap {
  const { positions, indices } = context.surface(surfaceId);
  const edges = new Map<string, number>();
  for (let at = 0; at < indices.length; at += 3)
    for (let k = 0; k < 3; k++) {
      const a = indices[at + k];
      const b = indices[at + ((k + 1) % 3)];
      const key = a < b ? a + "," + b : b + "," + a;
      edges.set(key, (edges.get(key) ?? 0) + 1);
    }
  const open = [...edges.values()].filter((count) => count !== 2).length;
  if (open !== 0)
    return {
      reason: `the surface ${surfaceId} is not closed (${open} edges not shared by two triangles)`,
    };
  let volume = 0;
  for (let at = 0; at < indices.length; at += 3) {
    const [a, b, c] = [indices[at], indices[at + 1], indices[at + 2]].map(
      (vertex) => [
        positions[3 * vertex],
        positions[3 * vertex + 1],
        positions[3 * vertex + 2],
      ],
    );
    volume +=
      (a[0] * (b[1] * c[2] - b[2] * c[1]) -
        a[1] * (b[0] * c[2] - b[2] * c[0]) +
        a[2] * (b[0] * c[1] - b[1] * c[0])) /
      6;
  }
  return volume * 1e6;
}
