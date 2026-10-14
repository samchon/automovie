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
 *
 * @evidence contracts/common.md#principled-implementation Keys corners by source vertex and exact UV pair, assigning render indices at first occurrence so atlas seams keep distinct attribute aliases.
 * @evidence contracts/common.md#clear-and-simple-design One canonical correspondence owns numbering used by region gathers and reverse source transport.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Admitted corner order and UV values determine numbering without anatomy, fixture or expected-answer branches.
 * @evidence contracts/common.md#meaningful-documentation Documents seam splitting, source/render correspondence and independence from shape and pose.
 * @evidence contracts/performance.md#efficient-algorithms For C corners and U unique source/UV pairs, one map pass costs expected O(C), with O(U) keys/sources and O(C) indices; actual UV splits require the full pass.
 * @evidence contracts/performance.md#reuse-equivalent-work Callers compile region-only correspondence once and rebuild it when retained indices/UVs change.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The key map ends after compilation; returned correspondence arrays belong to the caller and acquire no handle/task.
 */
export function humanBasisRegionCorners(
  region: IHumanMaterialRegion,
): IHumanBasisRegionCorners {
  const vertices: Map<string, number> = new Map<string, number>();
  const sources: number[] = [];
  const indices: number[] = [];
  const uvs: number[] | null = region.uvs === null ? null : [];
  region.indices.forEach((source: number, corner: number): void => {
    const uv: number[] | undefined = region.uvs?.slice(
      corner * 2,
      corner * 2 + 2,
    );
    const key: string = `${source}/${uv?.join(",") ?? ""}`;
    let index: number | undefined = vertices.get(key);
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
