import {
  IAutoMovieModelRecipe,
} from "@automovie/interface";

import { autoMovieRenderDigest } from "../render/autoMovieRenderDigest";
import { canonicalizeAutoMovieJson } from "../text/canonicalizeAutoMovieJson";

/**
 * Content digest for one LOD tier's model-recipe reference.
 *
 * The design gate refuses an absent recipe and a non-finite parameter alike, so
 * neither reaches a compiled population through a tracked model recipe. The
 * kernel still answers for both the bounded way it answers an unknown
 * projection radius: a reference that cannot be canonically encoded digests a
 * marker naming what the tier pointed at, instead of letting a canonical-JSON
 * refusal escape and discard the whole compiled formation or instance set.
 *
 * The digest is the SHA-256 of canonical JSON v2 computed without a Node
 * built-in, equal to the Node builder's digest of the same canonical bytes.
 * Shared by the compiled formation and instance-set kernels; package-private.
 *
 * @evidence contracts/common.md#principled-implementation Hash canonical JSON v2 for the referenced recipe; absent and unencodable references hash distinct explicit markers. Those markers identify a failure spelling rather than claim a digest of actual recipe content.
 * @evidence contracts/common.md#clear-and-simple-design One browser-safe digest owner is shared by both compact population compilers, independent of a host archetype catalogue.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The marker fallback is an existing kernel policy for calls outside design-gate admission; it neither repairs an invalid recipe nor suppresses a tracked design's upstream refusal.
 * @evidence contracts/common.md#meaningful-documentation Docs identify SHA-256 canonical bytes, missing/unencodable markers and the fact that the kernel catches encoding refusal.
 * @evidence contracts/performance.md#efficient-algorithms Recipe lookup is map-based; canonicalization and SHA processing take O(B) work/storage in encoded recipe bytes, or constant-size marker bytes on fallback.
 * @evidence contracts/performance.md#reuse-equivalent-work Both compilers use the same canonicalizer/digest implementation; mutable recipes preclude retaining a digest by object identity alone.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Encoded bytes and hash state are call-local; only the returned string survives, with no Node handle or host registry retained.
 */
export const compiledLodRecipeDigest: (recipes: ReadonlyMap < string , IAutoMovieModelRecipe >, id: string) => string = (
  recipes: ReadonlyMap<string, IAutoMovieModelRecipe>,
  id: string,
): string => {
  const recipe: IAutoMovieModelRecipe | undefined = recipes.get(id);
  if (recipe === undefined)
    return autoMovieRenderDigest(
      canonicalizeAutoMovieJson({ id, missing: true }),
    );
  try {
    return autoMovieRenderDigest(canonicalizeAutoMovieJson(recipe));
  } catch {
    return autoMovieRenderDigest(
      canonicalizeAutoMovieJson({ id, unencodable: true }),
    );
  }
};
