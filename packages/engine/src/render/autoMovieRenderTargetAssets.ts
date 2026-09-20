import { AutoMovieContentDigest, IAutoMovieRenderTargetAsset } from "@automovie/interface";
import { compareAutoMovieRenderIds } from "./compareAutoMovieRenderIds";

/**
 * Assets shorthand: pair paths with digests already proved elsewhere.
 *
 * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-frame-dependency-closure Converts every named asset dependency into the path-digest records sealed by the render target.
 * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity Sorts the supplied dependency closure before target fingerprinting.
 * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-target-dependency-fingerprint Canonicalizes the declared render-content closure as sorted path-and-byte-digest roles for target identity.
 */
export const autoMovieRenderTargetAssets = (
  entries: Readonly<Record<string, AutoMovieContentDigest>>,
): IAutoMovieRenderTargetAsset[] =>
  Object.keys(entries)
    .sort(compareAutoMovieRenderIds)
    .map((path) => ({ path, digest: entries[path]! }));
