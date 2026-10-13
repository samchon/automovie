import type { IHumanViewerPublishedGeneration } from "./IHumanViewerPublishedGeneration.js";
import { humanViewerBasisTokens } from "./humanViewerBasisTokens.js";

/**
 * The paired source token of a person or body drawn on the published one-skin generation:
 * it names both view files' bytes, so a replaced view is refused rather than
 * built under the old name.
 *
 * @evidence contracts/common.md#clear-and-simple-design One builder serves people and bodies whose constructor consumes the same paired generation.
 * @evidence contracts/common.md#principled-implementation Both published view digests enter the existing paired token, so constructor requests retain head/body publication identity together.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Encodes the supplied publication's digests rather than selecting an asset by subject or substituting a separately built body basis.
 * @evidence contracts/common.md#meaningful-documentation States what the token names and why.
 */
export function humanViewerPublishedGenerationBasis(
  generation: IHumanViewerPublishedGeneration,
): string {
  return `${humanViewerBasisTokens.publishedGeneration}@${generation.headDigest.slice(0, 12)}.${generation.bodyDigest.slice(0, 12)}`;
}
