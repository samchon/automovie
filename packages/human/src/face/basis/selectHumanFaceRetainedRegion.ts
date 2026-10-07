import type { IAutoMovieHumanFaceBasisRegion } from "../structures/IAutoMovieHumanFaceBasisRegion";

/**
 * Retain unowned triangles of a shared source material region after generation.
 * One material can contain disconnected left/right components. Replacing one
 * removes its complete triangles, not the other side's UVs, source identities
 * or finish. A triangle straddling an enrolled component boundary refuses rather
 * than inventing a cut. Empty returns no resident part; omission returns the
 * original region object so its existing compiled gatherer remains unchanged.
 * @evidence contracts/common.md#principled-implementation Exact source triangle ownership preserves unrequested components and per-corner UV correspondence without coordinate guesses.
 * @evidence contracts/common.md#clear-and-simple-design One incidence-selection owner returns the unchanged, retained or empty source region.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No whole shared region is discarded for a unilateral request and no mixed triangle is silently clipped.
 * @evidence contracts/common.md#meaningful-documentation States independent sides, original-object reuse, UV/source preservation and mixed-boundary refusal.
 * @evidence contracts/modeling.md#shared-boundaries Removes only complete enrolled triangles and preserves every unowned source interface.
 * @evidence contracts/modeling.md#spatial-conventions Source vertex indices and dimensionless corner UVs are copied without conversion.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Preserves the source region identity without naming another part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Selects actual existing incidence; the region gatherer emits geometry.
 * @evidenceExclude contracts/modeling.md#parameter-channels Adds no user control or private component selection.
 * @evidenceExclude contracts/modeling.md#rendered-observation The actual model/viewer owner observes retained and generated components together.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Triangle selection supplies no biological measurement or population.
 * @evidenceExclude contracts/anatomy.md#permitted-range Bounds no anatomical quantity.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Uses publisher-owned component incidence, not a personal input.
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
