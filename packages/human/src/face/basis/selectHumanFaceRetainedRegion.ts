import type { IAutoMovieHumanFaceBasisRegion } from "../structures/IAutoMovieHumanFaceBasisRegion";

/**
 * Retain unowned triangles of a shared source material region after generation.
 * One material can contain disconnected left/right components. Replacing one
 * removes its complete triangles, not the other side's UVs, source identities
 * or finish. A triangle straddling an enrolled component boundary refuses rather
 * than inventing a cut. Empty returns no resident part; omission returns the
 * original region object so its existing compiled gatherer remains unchanged.
 *
 * @evidence contracts/common.md#principled-implementation Complete triangles whose three vertices belong to the generated replacement are removed with their per-corner UVs; unowned triangles retain source order/metadata. The resident consumer uses returned identity to retain an unchanged compiled gatherer.
 * @evidence contracts/common.md#clear-and-simple-design This selector owns only retained whole triangles; enrollment owns replacement vertices and the gatherer owns physical correspondence.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Mixed-ownership triangles refuse instead of inventing cuts. Empty and no-change results preserve undefined/original identity; no coordinate weld or opposite-side deletion repairs a region.
 * @evidence contracts/common.md#meaningful-documentation Prose gives disconnected shared-material semantics, per-corner UV preservation, mixed-boundary refusal and identity-sensitive empty/no-change results.
 * @evidence contracts/performance.md#efficient-algorithms One T-triangle pass performs three set lookups and copies retained corners, O(T) expected work/storage. Empty replacement skips work; nonempty no-match replacement still creates temporary copies.
 * @evidence contracts/performance.md#reuse-equivalent-work Original identity preserves its compiled gatherer; changed indices get a new region and cannot reuse that old gatherer under a false identity match.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Changed index/UV arrays transfer with borrowed source metadata; rejected/no-change temporaries are collectible and no registry or external resource is retained.
 */
export function selectHumanFaceRetainedRegion(
  region: IAutoMovieHumanFaceBasisRegion,
  replaced: ReadonlySet<number>,
): IAutoMovieHumanFaceBasisRegion | undefined {
  if (replaced.size === 0) return region;
  const indices: number[] = [],
    uvs: number[] | null = region.uvs === null ? null : [];
  for (let corner: number = 0; corner < region.indices.length; corner += 3) {
    const triangle: number[] = region.indices.slice(corner, corner + 3),
      owned: number = triangle.filter((vertex: number): boolean  => replaced.has(vertex)).length;
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
