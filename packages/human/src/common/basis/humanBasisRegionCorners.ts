import type { IHumanBasisRegionCorners } from "../structures/IHumanBasisRegionCorners";
import type { IHumanMaterialRegion } from "../structures/IHumanMaterialRegion";

/**
 * The fixed correspondence between a connected surface's shared vertices and
 * the render vertices of one material region.
 *
 * A region draws the triangles of one material, and a UV seam or a material
 * boundary splits a shared vertex into several render vertices. The render
 * vertices are numbered by first appearance over the region's corners, keyed
 * by the shared vertex and the corner's UV pair, so `sources[i]` is the shared
 * vertex render vertex `i` copies and `indices` is the region's triangle list
 * over the render vertices. `createHumanBasisRegion` gathers evaluated
 * arrays through exactly this table, and a stage that has to write a shared
 * result back into the render vertices (or read one back out) must use the
 * same table rather than rediscover the numbering, because a second numbering
 * would silently disagree the first time the region's corner order changed.
 *
 * The result depends on the region alone. Nothing about the basis's shape,
 * pose or document enters it, so a caller compiles it once per basis.
 */
export function humanBasisRegionCorners(
  region: IHumanMaterialRegion,
): IHumanBasisRegionCorners {
  const vertices = new Map<string, number>();
  const sources: number[] = [];
  const indices: number[] = [];
  const uvs: number[] | null = region.uvs === null ? null : [];
  region.indices.forEach((source, corner) => {
    const uv = region.uvs?.slice(corner * 2, corner * 2 + 2);
    const key = `${source}/${uv?.join(",") ?? ""}`;
    let index = vertices.get(key);
    if (index === undefined) {
      index = vertices.size;
      vertices.set(key, index);
      sources.push(source);
      if (uv !== undefined) uvs!.push(...uv);
    }
    indices.push(index);
  });
  return { sources, indices, uvs };
}
