import type { IAutoMovieHumanSkinLandmark } from "./IAutoMovieHumanSkinLandmark";
import type { IAutoMovieHumanSkinLandmarkSurface } from "./IAutoMovieHumanSkinLandmarkSurface";

/**
 * A basis that may name points of its skin: its identity, its surfaces'
 * positions and its named skin points. Face and body bases both satisfy it.
 *
 * @evidence contracts/common.md#principled-implementation Basis identity, surface position views and an optional landmark table supply the shared landmark admission boundary.
 * @evidence contracts/common.md#clear-and-simple-design Face and body satisfy the same restricted structural view without sharing unrelated basis internals.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Omitted landmarks supply no fabricated points; refusals retain the actual basis identity.
 * @evidence contracts/common.md#meaningful-documentation Members identify surface indexing, optional named points and diagnostic identity.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The skin landmark admission view has no runtime implementation that chooses an algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The skin landmark admission view schema implements no cache or request sharing.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The skin landmark admission view declaration allocates no runtime state or handles.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanSkinLandmarkHolder {
  /** The basis identity, named in refusals. */
  id: string;

  /** The basis surfaces, by index. */
  surfaces: readonly IAutoMovieHumanSkinLandmarkSurface[];

  /** The basis's named skin points. */
  skinLandmarks?: Record<string, IAutoMovieHumanSkinLandmark>;
}
