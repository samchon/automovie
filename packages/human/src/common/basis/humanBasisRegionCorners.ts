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
 * @evidence contracts/common.md#principled-implementation Numbering render vertices by first appearance of the pair (shared vertex, UV) reproduces the seam-splitting the material separation performs, and keeping the pair as the key is what keeps two corners that share a vertex but not a UV apart.
 * @evidence contracts/common.md#clear-and-simple-design One function owns the numbering, and both the gatherer and any stage that scatters back read this table.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No basis, subject or document is consulted; the table follows from the region's corners alone.
 * @evidence contracts/common.md#meaningful-documentation The comment states what the two returned arrays index, why the UV pair is part of the key and who must share the table.
 * @evidence contracts/modeling.md#spatial-conventions Indices only; no unit or frame enters.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function numbers the render vertices of one region and defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no primitive; it numbers the corners the region already has.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no boundary between parts.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function owns no displayed form; the regions it numbers are observed by their owners.
 */
export function humanBasisRegionCorners(region: IHumanMaterialRegion): {
  sources: number[];
  indices: number[];
  uvs: number[] | null;
} {
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
