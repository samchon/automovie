import { IAutoMovieRepaintSequenceObservation } from "@automovie/interface";
import { productionRepaintObservationIsExactText } from "./productionRepaintObservationIsExactText";

/**
 * Admit descriptive baseline address/version, nonempty unique scope and unique exact intended-delta text. Empty intendedDeltas is supported. This operation does not resolve the baseline document or decide that authored deltas were observed.
 *
 * @evidence contracts/common.md#principled-implementation Exact address/version and nonempty scope precede per-array text admission and Set cardinality checks for duplicate scope or intended-delta entries.
 * @evidence contracts/common.md#clear-and-simple-design Baseline metadata policy is separate from observation currentness, document resolution and playback judgments.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Descriptive text is not actual baseline reading or delta verification; unsupported/duplicate text refuses without deduplication or a default scope.
 * @evidence contracts/common.md#meaningful-documentation Prose gives nonempty scope, optional empty deltas, uniqueness and metadata-only address meaning.
 * @evidence contracts/performance.md#efficient-algorithms Scope/delta scans plus two Sets cost O(S+D+text lengths) and O(S+D) identity storage without sorting or document I/O.
 * @evidence contracts/performance.md#reuse-equivalent-work Shared exact-text policy serves every field while each current mutable baseline is re-admitted without a prior result cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Sets and trim temporaries expire; neither baseline records nor referenced document bytes are retained.
 */
export const productionRepaintObservationAssertBaseline: (baseline: IAutoMovieRepaintSequenceObservation["baseline"]) => void = (
  baseline: IAutoMovieRepaintSequenceObservation["baseline"],
): void => {
  if (
    !productionRepaintObservationIsExactText(baseline.address) ||
    !productionRepaintObservationIsExactText(baseline.version) ||
    baseline.scope.length === 0 ||
    baseline.scope.some((value: string): boolean => !productionRepaintObservationIsExactText(value)) ||
    new Set(baseline.scope).size !== baseline.scope.length ||
    baseline.intendedDeltas.some((value: string): boolean => !productionRepaintObservationIsExactText(value)) ||
    new Set(baseline.intendedDeltas).size !== baseline.intendedDeltas.length
  )
    throw new Error("Repaint sequence observation baseline is malformed.");
};
