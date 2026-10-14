import type { IAutoMovieHumanFaceConstructionProgress } from "../../face/structures/IAutoMovieHumanFaceConstructionProgress";

/**
 * Compose one actual face-owner completion as a transport stage label, preserving document, basis, phase and optional geometry/check identity. Geometry identity takes precedence when both optional identities are supplied. This observational label is neither an admission verdict nor worker/GPU health evidence; the producer owns record validity and delivery.
 *
 * @evidence contracts/common.md#principled-implementation Existing completion identities form one exact face-prefixed label without estimating a percentage or inventing an unexecuted owner stage.
 * @evidence contracts/common.md#clear-and-simple-design The formatter owns string composition only; construction timing, callback effects and transport progress have their existing owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Optional geometry/check precedence remains explicit and a label does not certify acceptance, clinical validity or current viewer health.
 * @evidence contracts/common.md#meaningful-documentation Prose names label identity fields, optional precedence and producer-owned admission/delivery.
 * @evidence contracts/performance.md#efficient-algorithms Fixed field selection and concatenation cost the actual identifier string lengths, without geometry or source traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Distinct completed records format independently; this pure helper implements no event deduplication or delivery coordinator.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the new label string escapes, with no record, callback task or observer buffer retained.
 *
 * @author Samchon
 */
export function describeConnectedPersonFaceProgress(
  progress: IAutoMovieHumanFaceConstructionProgress,
): string {
  return (
    "face:" +
    progress.documentId +
    ":" +
    progress.basis +
    ":" +
    progress.phase +
    (progress.geometryOwner === undefined
      ? progress.checkOwner === undefined
        ? ""
        : ":" + progress.checkOwner
      : ":" + progress.geometryOwner)
  );
}
