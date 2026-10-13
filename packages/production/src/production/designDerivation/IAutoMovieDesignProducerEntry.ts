import type { IAutoMovieDesignMutationOutput } from "@automovie/interface";
import type { IAutoMovieDesignDerivationBasis } from "./IAutoMovieDesignDerivationBasis";

/**
 * One caller-owned target/path selector with evaluation and store callbacks.
 *
 * @evidence contracts/common.md#principled-implementation Run captures declared source metadata, calls the no-argument evaluate callback twice and later invokes store in original entry order.
 * @evidence contracts/common.md#clear-and-simple-design Source selector and target/path mapping stay with the same callbacks that produce and publish that record.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Evaluation reads the captured environment without cloned-basis arguments or a sandbox; sequential stores can leave earlier effects after a later refusal.
 * @evidence contracts/common.md#meaningful-documentation Defines logical target, POSIX record path, metadata-only export/selector and caller-owned evaluation/store effects.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The shape erases; two evaluations and accepted stores retain their callback-defined workload in run's full cost.
 * @evidence contracts/performance.md#reuse-equivalent-work Run skips a store only on full canonical resident-byte equality; equal entry names alone do not deduplicate evaluation effects.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Run borrows entries/callback closures throughout synchronous staging/publication, without independently bounding or retiring resources those callbacks own.
 *
 * @author Samchon
 */
export interface IAutoMovieDesignProducerEntry {
  /** Stable logical target identity, spelled by `autoMovieDesignTargetAddress`. */
  target: string;

  /** Canonical project-relative path the project store publishes the record at. */
  recordPath: string;

  /** Declared source export and selector; evaluation/source correspondence is the caller's premise. */
  source: IAutoMovieDesignDerivationBasis["source"];

  /**
   * Evaluate from the caller's captured environment; no cloned basis argument or sandbox is supplied.
   *
   * @evidence contracts/common.md#principled-implementation Run invokes this no-argument callback twice and canonicalizes both returned values; repeatable, correctly source-bound evaluation is the caller's premise.
   * @evidence contracts/common.md#clear-and-simple-design The source selector and target/path sit beside their actual evaluator while candidate metadata and byte comparison remain separate owners.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Captured host state and callback effects are neither frozen nor sandboxed; the run's evaluator deliberately ignores the candidate's cloned basis argument and must not be described as isolated execution.
   * @evidence contracts/common.md#meaningful-documentation States no-argument captured-environment semantics, two observations and separate canonical output admission without a purity guarantee.
   * @evidence contracts/performance.md#efficient-algorithms Callback cost follows its caller-defined workload and runs twice per entry; canonical serialization additionally processes the full returned values.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Two evaluations intentionally remain distinct observations; this callback defines no cache or equality proof for effects.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns closure resources and returned values; run borrows the callback synchronously and retains staged canonical bytes until publication/result release.
   */
  evaluate: () => unknown;

  /**
   * Store one canonical value through the caller's project setter and return its acceptance/refusal.
   *
   * @evidence contracts/common.md#principled-implementation Run parses its selected staged bytes and invokes this setter in declared entry order, preserving actual accepted:false diagnostics or thrown failure.
   * @evidence contracts/common.md#clear-and-simple-design Publication belongs to the supplied setter while staging and unchanged-byte comparison remain run responsibilities.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Sequential accepted writes are not rolled back after a later refused/thrown store; acceptance is the setter's observation rather than an independently verified transaction.
   * @evidence contracts/common.md#meaningful-documentation Documents canonical input, actual mutation output and partial-write failure ownership without promising atomic project publication.
   * @evidence contracts/performance.md#efficient-algorithms Setter cost follows its actual validation/IO workload; run skips it only when supplied resident values have identical complete canonical bytes.
   * @evidence contracts/performance.md#reuse-equivalent-work Store effects are not shared by target or label equality; current byte equality alone permits the owning run's unchanged-store elision.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Store implementation owns acquired files/transactions and any persistent mutation; the synchronous callback signature supplies neither rollback nor an independent resource manager.
   */
  store: (value: unknown) => IAutoMovieDesignMutationOutput;
}
