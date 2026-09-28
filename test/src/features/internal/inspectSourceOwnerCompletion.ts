import type { IAutoMovieProductionEvidenceSourceOwnerBinding } from "@automovie/evidence";
import {
  isAutoMovieSourceOwnerBindingComplete,
  resolveAutoMovieSourceOwnerBinding,
} from "@automovie/production";

/** Observe completion and both admission scopes for one exact typed edge. */
export const inspectSourceOwnerCompletion = (
  edge: IAutoMovieProductionEvidenceSourceOwnerBinding,
) => {
  const resolve = (required: boolean) =>
    resolveAutoMovieSourceOwnerBinding({
      bindings: [edge],
      branch: edge.branch,
      sourcePath: edge.sourcePath,
      exportName: edge.exportName,
      sourceDigest: edge.sourceDigest,
      requireReviewed: required,
    });
  return {
    complete: isAutoMovieSourceOwnerBindingComplete(edge),
    admission: resolve(true).success,
    sourceDiagnosis: resolve(false).success,
  };
};
