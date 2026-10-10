import type { IAutoMovieHumanFaceConstructionProgress } from "@automovie/human/face/structures/IAutoMovieHumanFaceConstructionProgress";

/**
 * Carry an actual face construction completion into the worker's stage label.
 * Document, basis and completed condition identities come unchanged from the
 * face owner. A stage is transport progress and never an admission verdict.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor Keeps the editor worker responsive to actual construction completions without changing its person's document or admission.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor-view Names completed face boundaries from the actual owner event rather than an elapsed-time estimate.
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
      ? progress.checkOwner === undefined ? "" : ":" + progress.checkOwner
      : ":" + progress.geometryOwner)
  );
}
