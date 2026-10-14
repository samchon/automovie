import type { IAutoMovieModel, IAutoMovieMaterial as IAutoMovieMaterialImported } from "@automovie/interface";



/** Alpha-mode-only material classification shared by the AO bake and its cache.
 * Masked and blended finishes do not occlude this estimate. Transmission and
 * opacity are not read, so the generated transmission-one cornea is included
 * when its alphaMode is omitted. This is not physical transparent visibility.
 *
 * @evidence contracts/common.md#principled-implementation The current material alphaMode alone excludes mask/blend ids from the baker's occluder estimate; all other ids are included, including the generated transmission-one cornea with omitted alphaMode. Bake and cache consume the same approximation, which does not model transmission or opacity.
 * @evidence contracts/common.md#clear-and-simple-design One material-only classification owner serves geometry ray collection and cache invalidation; mesh usage and UV requirements remain with their consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Mask/blend omission and opaque treatment of every other alpha mode are explicit limitations: transparent corneal transmission is not respected by this estimate. Actual modes are read without fixture ids or texture guesses; the result does not certify complete optical visibility.
 * @evidence contracts/common.md#meaningful-documentation Prose identifies shared bake/cache responsibility and the omitted mask/blend classes, without presenting classification as anatomical or physical scattering evidence.
 * @evidence contracts/performance.md#efficient-algorithms One O(M) material filter/map builds an expected constant-membership id set with O(M) temporary/output storage; no mesh, pixel or geometry traversal is performed here.
 * @evidence contracts/performance.md#reuse-equivalent-work Both consumers share this rule, but each request reads current modes because document composition can change membership. No stale set is cached under a model id.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The fresh set contains only current id strings and transfers to its caller; temporary arrays become collectible, with no retained model history or external resource.
 *
 * @author Samchon
 */
export function humanFaceOcclusionOpaqueMaterials(
  model: IAutoMovieModel,
): Set<string> {
  return new Set(
    model.materials
      .filter(
        (material: IAutoMovieMaterialImported): boolean  =>
          material.alphaMode !== "mask" && material.alphaMode !== "blend",
      )
      .map((material: IAutoMovieMaterialImported): string  => material.id),
  );
}
