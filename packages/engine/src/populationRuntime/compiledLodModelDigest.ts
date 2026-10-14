import { IAutoMovieModel } from "@automovie/interface";

import { autoMovieRenderDigest } from "../render/autoMovieRenderDigest";
import { canonicalizeAutoMovieJson } from "../text/canonicalizeAutoMovieJson";

/**
 * Content digest for one LOD tier's model group reference.
 *
 * An absent group hashes a marker naming the missing reference. A group that cannot be canonically encoded hashes a distinct marker naming the unencodable reference, rather than letting the encoding refusal discard the complete compiled population. Neither marker certifies model content or validity; callers own admission of their model inventory.
 *
 * The digest is the SHA-256 of canonical JSON v2 computed without a Node
 * built-in, equal to the Node builder's digest of the same canonical bytes.
 * Shared by the compiled formation and instance-set kernels; package-private.
 *
 * @evidence contracts/common.md#principled-implementation Hash canonical JSON v2 of the referenced `IAutoMovieModel` group, so parts, skeleton and materials all enter the identity; absent and unencodable references hash distinct explicit markers. Those markers identify a failure spelling rather than claim a digest of actual model content.
 * @evidence contracts/common.md#clear-and-simple-design One browser-safe digest owner is shared by both compact population compilers and reads the model group a film references, with no construction recipe or archetype catalogue in between.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing and unencodable markers are explicit kernel identity policy, not a substitute model or content-validity verdict; callers must perform any model admission they require before compilation.
 * @evidence contracts/common.md#meaningful-documentation Docs identify SHA-256 canonical bytes, missing/unencodable markers and the fact that the kernel catches encoding refusal.
 * @evidence contracts/performance.md#efficient-algorithms Model lookup is map-based; canonicalization and SHA processing take O(B) work/storage in encoded model bytes, or constant-size marker bytes on fallback, so a mesh-heavy group costs its full encoded size per referencing tier.
 * @evidence contracts/performance.md#reuse-equivalent-work Both compilers use the same canonicalizer/digest implementation; mutable model records preclude retaining a digest by object identity alone.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Encoded bytes and hash state are call-local; only the returned string survives, with no Node handle or host registry retained.
 */
export const compiledLodModelDigest: (
  models: ReadonlyMap<string, IAutoMovieModel>,
  id: string,
) => string = (
  models: ReadonlyMap<string, IAutoMovieModel>,
  id: string,
): string => {
  const model: IAutoMovieModel | undefined = models.get(id);
  if (model === undefined)
    return autoMovieRenderDigest(
      canonicalizeAutoMovieJson({ id, missing: true }),
    );
  try {
    return autoMovieRenderDigest(canonicalizeAutoMovieJson(model));
  } catch {
    return autoMovieRenderDigest(
      canonicalizeAutoMovieJson({ id, unencodable: true }),
    );
  }
};
