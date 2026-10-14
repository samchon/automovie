import { IAutoMovieDiagnostic, IAutoMovieModel } from "@automovie/interface";

/**
 * Shot-local model registry, model projections, accepted authored models and accumulated source findings. Error-bearing results are returned for diagnostic completeness and must be refused by assembly.
 *
 * @evidence contracts/common.md#principled-implementation The exact-own-key record shares accepted model references with its value array and source-owned subset. Findings retain source attribution; domain adapters classify lineage/building/placement findings, while model failures use blocking content errors and successful model warnings are omitted.
 * @evidence contracts/common.md#clear-and-simple-design One internal result transfers source-model admission work to adoption and actor binding instead of rebuilding a separate public registry API.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Readonly typing does not deep-freeze model contents, and an authored model can coexist with collected reference errors; returned presence is not proof of a successful shot.
 * @evidence contracts/common.md#meaningful-documentation Documents registry identity, borrowed versus authored model references, local lifetime and the required error-category gate.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased registry-result shape performs no byte digest or geometry validation; sourceRuntimeOf owns those algorithms.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type introduces no model-admission cache; the producer owns per-call digest and exact-key registry reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The interface acquires no handle or task; the returned registry and accepted model references belong to the shot build attempt.
 * @author Samchon
 */
export interface IProductionShotSourceRuntime {
  /** Portable own-key registry containing builder and admitted authored models. */
  runtimeModels: Readonly<Record<string, IAutoMovieModel>>;

  /** Current registry values; model objects are borrowed rather than cloned. */
  models: IAutoMovieModel[];

  /** Source-owned accepted model subset retained for the compiled artifact. */
  authoredModels: IAutoMovieModel[];

  /** Accumulated source admission errors and classified validator findings. */
  diagnostics: IAutoMovieDiagnostic[];
}
