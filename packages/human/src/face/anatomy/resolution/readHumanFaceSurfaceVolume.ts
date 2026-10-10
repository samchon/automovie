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
