import type { IAutoMovieHumanSkinLandmarkSurface } from "./IAutoMovieHumanSkinLandmarkSurface";
import type { IAutoMovieHumanSkinRegion } from "./IAutoMovieHumanSkinRegion";

/**
 * A basis that may name areas of its skin: its identity, its surfaces'
 * positions and its named skin areas. Face and body bases both satisfy it.
 *
 *
 * @evidence contracts/common.md#principled-implementation The view couples basis identity, indexed surface positions and optional named areas; assertHumanSkinRegions checks area ordinals against those same surfaces.
 * @evidence contracts/common.md#clear-and-simple-design Face and body admission share only fields needed by region admission, leaving their unrelated channels and rigs with their owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An omitted area dictionary creates no substitute vertices or fallback basis.
 * @evidence contracts/common.md#meaningful-documentation Documents indexed surface order, optional named areas and the diagnostic identity used by refusals.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This region-holder declaration implements no traversal; assertHumanSkinRegions owns admission work.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The caller-owned region table is data transport, not cached or in-flight execution.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The interface acquires no task or handle; the basis owner retains its surfaces and membership arrays.
 *
 *
 * @author Samchon
 */
export interface IAutoMovieHumanSkinRegionHolder {
  /** The basis identity, named in refusals. */
  id: string;

  /** The basis surfaces, by index. */
  surfaces: readonly IAutoMovieHumanSkinLandmarkSurface[];

  /** The basis's named skin areas. */
  skinRegions?: Record<string, IAutoMovieHumanSkinRegion>;
}
