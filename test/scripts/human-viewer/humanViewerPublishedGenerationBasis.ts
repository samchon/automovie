import type { IHumanViewerPublishedGeneration } from "./IHumanViewerPublishedGeneration";
import { humanViewerBasisTokens } from "./humanViewerBasisTokens";

/**
 * The paired source token of a person or body drawn on the published one-skin generation:
 * it names both view files' bytes, so a replaced view is refused rather than
 * built under the old name.
 *
 * @evidence contracts/common.md#clear-and-simple-design One builder serves people and bodies whose constructor consumes the same paired generation.
 * @evidence contracts/common.md#meaningful-documentation States what the token names and why.
 */
export function humanViewerPublishedGenerationBasis(generation: IHumanViewerPublishedGeneration): string {
  return `${humanViewerBasisTokens.publishedGeneration}@${generation.headDigest.slice(0, 12)}.${generation.bodyDigest.slice(0, 12)}`;
}
