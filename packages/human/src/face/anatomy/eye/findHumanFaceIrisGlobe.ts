import type { IAutoMovieHumanFaceBasis } from "../../structures/IAutoMovieHumanFaceBasis";
import type { IHumanFaceIrisGlobe } from "./structures/IHumanFaceIrisGlobe";
import type { IHumanFaceIrisGlobeTriangle } from "./structures/IHumanFaceIrisGlobeTriangle";

/**
 * The globe of one eye: the first textured, UV-bearing region whose triangles
 * are fully bound to that eye owner (weight one on all three vertices), with
 * the neutral positions of those vertices. Null when no surface has one.
 *
 * Only an embedded PNG can be repainted, so a region whose material names an
 * external texture, or has no UVs, is skipped. The basis is read only.
 *
 * @author Samchon
 */
export function findHumanFaceIrisGlobe(
  basis: IAutoMovieHumanFaceBasis,
  eye: string,
): IHumanFaceIrisGlobe | null {
  for (const surface of basis.surfaces) {
    const rows =
      surface.attachments?.find((one) => one.owner === eye)?.rows ?? [];
    const bound = new Set<number>();
    for (let i = 0; i < rows.length; i += 2)
      if (rows[i + 1] === 1) bound.add(rows[i]);
    const point = (vertex: number): [number, number, number] => [
      surface.positions[3 * vertex],
      surface.positions[3 * vertex + 1],
      surface.positions[3 * vertex + 2],
    ];
    for (const region of surface.regions) {
      const texture = basis.materials.find(
        (one) => one.id === region.material,
      )?.baseColorTexture;
      // Only an embedded PNG can be repainted; a texture reference names an
      // image this builder cannot read, and untextured geometry has no iris.
      if (region.uvs === null || typeof texture !== "string") continue;
      const uvs = region.uvs;
      const triangles: IHumanFaceIrisGlobeTriangle[] = [];
      for (let t = 0; t < region.indices.length; t += 3) {
        const corners = region.indices.slice(t, t + 3);
        if (corners.every((vertex) => bound.has(vertex)))
          triangles.push({
            positions: corners.map(point),
            uvs: [0, 1, 2].map((k) => [uvs[2 * (t + k)], uvs[2 * (t + k) + 1]]),
          });
      }
      if (triangles.length === 0) continue;
      const vertices = [
        ...new Set(region.indices.filter((vertex) => bound.has(vertex))),
      ];
      return {
        eye,
        material: region.material,
        texture,
        triangles,
        positions: vertices.map(point),
      };
    }
  }
  return null;
}
