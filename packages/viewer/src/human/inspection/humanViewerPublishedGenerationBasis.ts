import type { IHumanViewerPublishedGeneration } from "./IHumanViewerPublishedGeneration.js";
import { humanViewerBasisTokens } from "./humanViewerBasisTokens.js";

/**
 * The paired source token of a person or body drawn on the published one-skin generation:
 * it names both view files' bytes, so a replaced view is refused rather than
 * built under the old name.
 */
export function humanViewerPublishedGenerationBasis(
  generation: IHumanViewerPublishedGeneration,
): string {
  return `${humanViewerBasisTokens.publishedGeneration}@${generation.headDigest.slice(0, 12)}.${generation.bodyDigest.slice(0, 12)}`;
}
