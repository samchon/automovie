import type { IAutoMovieHumanFaceBasisRegion } from "../structures/IAutoMovieHumanFaceBasisRegion";

/**
 * Retain unowned triangles of a shared source material region after generation.
 * One material can contain disconnected left/right components. Replacing one
 * removes its complete triangles, not the other side's UVs, source identities
 * or finish. A triangle straddling an enrolled component boundary refuses rather
 * than inventing a cut. Empty returns no resident part; omission returns the
 * original region object so its existing compiled gatherer remains unchanged.
 */
export function selectHumanFaceRetainedRegion(
  region: IAutoMovieHumanFaceBasisRegion,
  replaced: ReadonlySet<number>,
): IAutoMovieHumanFaceBasisRegion | undefined {
  if (replaced.size === 0) return region;
  const indices: number[] = [],
    uvs: number[] | null = region.uvs === null ? null : [];
  for (let corner = 0; corner < region.indices.length; corner += 3) {
    const triangle = region.indices.slice(corner, corner + 3),
      owned = triangle.filter((vertex) => replaced.has(vertex)).length;
    if (owned === 3) continue;
    if (owned !== 0)
      throw new Error(
        "Generated periocular component crosses a source triangle boundary: " +
          region.id,
      );
    indices.push(...triangle);
    uvs?.push(...region.uvs!.slice(2 * corner, 2 * corner + 6));
  }
  if (indices.length === region.indices.length) return region;
  return indices.length === 0 ? undefined : { ...region, indices, uvs };
}
