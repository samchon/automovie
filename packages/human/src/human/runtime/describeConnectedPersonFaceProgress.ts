import type { IAutoMovieHumanFaceConstructionProgress } from "../../face/structures/IAutoMovieHumanFaceConstructionProgress";

/**
 * Carry an actual face construction completion into the worker's stage label.
 * Document, basis and completed condition identities come unchanged from the
 * face owner. A stage is transport progress and never an admission verdict.
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
      ? progress.checkOwner === undefined ? "" : ":" + progress.checkOwner
      : ":" + progress.geometryOwner)
  );
}
