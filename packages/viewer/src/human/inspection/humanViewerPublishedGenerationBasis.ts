import type { IHumanViewerPublishedGeneration } from "./IHumanViewerPublishedGeneration.js";
import { humanViewerBasisTokens } from "./humanViewerBasisTokens.js";

/**
 * Project the two supplied published generation digests into the canonical paired prefix token. Mismatching current prefixes refuse, while a 12-hex prefix collision can leave changed view bytes under the same name; this token does not establish full content identity.
 *
 * @evidence contracts/common.md#principled-implementation The paired published token includes both actual head and body digest prefixes from the supplied generation authority.
 * @evidence contracts/common.md#clear-and-simple-design One token projection forwards canonical generation naming without rereading or combining view bytes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Both view identities participate so replacing one view does not retain a token naming only its sibling; digest validity remains with the generation reader.
 * @evidence contracts/common.md#meaningful-documentation The comment explains paired prefix authority, current mismatch refusal and the collision limit that prevents an absolute changed-byte guarantee.
 * @evidence contracts/performance.md#efficient-algorithms The projection slices two fixed digest prefixes and performs constant-size string assembly.
 * @evidence contracts/performance.md#reuse-equivalent-work The token names supplied generation bytes; actual worker reuse and digest verification are delegated rather than cached here.
 * @evidence contracts/performance.md#bound-retention-and-release-resources No generation view array is copied or retained separately; only the returned paired token survives.
 */
export function humanViewerPublishedGenerationBasis(
  generation: IHumanViewerPublishedGeneration,
): string {
  return `${humanViewerBasisTokens.publishedGeneration}@${generation.headDigest.slice(0, 12)}.${generation.bodyDigest.slice(0, 12)}`;
}
