import type {
  IAutoMovieHumanPersonCompiledGeneration,
  IAutoMovieHumanPersonDocument,
  IAutoMovieHumanPersonGenerationBuild,
} from "@automovie/human";

/**
 * A compiled person generation and the one-skin evaluator built from it.
 *
 * Preparation joins the paired head/body source once. The compiled generation supports whole-person readers, while build evaluates documents through the same one-skin owner and can refuse invalid or unsupported authored input. Optional observation hooks are supplied by the preparation owner and share that build.
 *
 * @evidence contracts/common.md#principled-implementation Compiled paired generation and its matching one-skin evaluator remain together so whole-person reads and repeated trial builds use the same source authority.
 * @evidence contracts/common.md#clear-and-simple-design The record exposes compiled reading data and one build function without moving joins, source loading or person schema admission into transport callers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An evaluator is not a prebuilt named subject or guaranteed successful document; owner refusal remains observable.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies joined-source preparation, reader versus build roles, refusal and shared optional observation hooks.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This evaluator schema chooses no compilation or one-skin construction algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Shared preparation is implemented by the resident runtime's promise owners rather than this value type.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Compiled source data belongs to the resident evaluator provider until worker retirement; this interface acquires no native worker itself.
 *
 * @author Samchon
 */
export interface IConnectedPersonEvaluator {
  /** The compiled generation. */
  compiled: IAutoMovieHumanPersonCompiledGeneration;

  /**
   * Evaluate a person document on the paired source and return its one-skin build, refusing unsupported input through the Human owner.
   *
   * @evidence contracts/common.md#principled-implementation The build evaluates authored person parameters against its matching compiled generation and existing numerical owner admission.
   * @evidence contracts/common.md#clear-and-simple-design One evaluator function serves trial reads and ordinary builds without another independent whole-person source compile.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Calls do not substitute a named portrait mesh or imply success before actual evaluation.
   * @evidence contracts/common.md#meaningful-documentation The member states paired-source evaluation, one-skin output and unsupported-input refusal.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The signature chooses no geometry construction or shape-resolution algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The provider owns shared source preparation and no result memoization is declared for distinct documents.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Numerical output and source retention remain implementation-owned; this function type starts no native lifetime itself.
   */
  build: (
    document: IAutoMovieHumanPersonDocument,
  ) => IAutoMovieHumanPersonGenerationBuild;
}
