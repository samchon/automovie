import type { IHumanFaceMeasurementSurface as ImportedIHumanFaceMeasurementSurface } from "@automovie/human";
import type { IHumanFaceMeasurementContext } from "./IHumanFaceMeasurementContext";
import type { IHumanFaceMeasurementGap } from "./IHumanFaceMeasurementGap";

/**
 * Read the signed origin-tetrahedron volume of one current model surface in cubic centimetres. Every undirected edge must occur twice or the reader returns a named gap. That count does not establish opposite triangle winding, embedding or an anatomical boundary; interpreting the signed sum as enclosed volume requires a consistently outward closed source surface.
 *
 * @evidence contracts/common.md#principled-implementation Origin-based signed tetrahedra sum oriented source triangles after undirected edge-use counts equal two.
 * @evidence contracts/common.md#clear-and-simple-design The same current surface supplies incidence admission and signed volume arithmetic.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Edge counts do not prove opposite winding, embedding or anatomical closure; consistently outward closed source orientation remains the enclosed-volume premise.
 * @evidence contracts/common.md#meaningful-documentation The signed model-surface result is cubic centimetres and failed edge counts return a named gap.
 * @evidence contracts/performance.md#efficient-algorithms Two triangle scans plus an edge-count map give linear incidence work and storage.
 * @evidence contracts/performance.md#reuse-equivalent-work One acquired current surface supplies both scans without reconstructing geometry.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The edge map and triangle vectors are temporary; only the scalar/gap escapes.
 *
 * @author Samchon
 */
export function readHumanFaceSurfaceVolume(
  context: IHumanFaceMeasurementContext,
  surfaceId: string,
): number | IHumanFaceMeasurementGap {
  const { positions, indices }: ImportedIHumanFaceMeasurementSurface = context.surface(surfaceId);
  const edges: Map<string, number> = new Map<string, number>();
  for (let at: number = 0; at < indices.length; at += 3)
    for (let k: number = 0; k < 3; k++) {
      const a: number = indices[at + k];
      const b: number = indices[at + ((k + 1) % 3)];
      const key: string = a < b ? a + "," + b : b + "," + a;
      edges.set(key, (edges.get(key) ?? 0) + 1);
    }
  const open: number = [...edges.values()].filter((count: number): boolean => count !== 2).length;
  if (open !== 0)
    return {
      reason: `the surface ${surfaceId} is not closed (${open} edges not shared by two triangles)`,
    };
  let volume: number = 0;
  for (let at: number = 0; at < indices.length; at += 3) {
    const [a, b, c]: number[][] = [indices[at], indices[at + 1], indices[at + 2]].map(
      (vertex: number): number[] => [
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
