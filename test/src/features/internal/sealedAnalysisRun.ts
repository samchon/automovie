import { autoMovieAnalysisRunDigest } from "../../../../packages/engine/src/analysis/autoMovieAnalysisRunDigest";
import type { IAutoMovieAnalysisRun } from "@automovie/interface";

/**
 * Seal a hand-authored run without asking the engine builder to approve it.
 *
 * The builder refuses to emit an invalid run, which is what it is for, so a scenario proving that the validator catches a malformed run has to write one itself. The digest is taken with the engine's own sealing rule, so what the validator then complains about is the structure and never the seal.
 *
 * Spreading the caller's draft preserves malformed metric, status and provenance records for validator assertions. The product digest isolates structural admission; it is not an independent hash oracle.
 */
export const sealedAnalysisRun: (draft: Omit<IAutoMovieAnalysisRun, "digest">) => IAutoMovieAnalysisRun = (
  draft: Omit<IAutoMovieAnalysisRun, "digest">,
): IAutoMovieAnalysisRun => ({
  ...draft,
  digest: autoMovieAnalysisRunDigest(draft),
});
