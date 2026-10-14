import type { IAutoMovieHumanPersonCompiledGeneration } from "./IAutoMovieHumanPersonCompiledGeneration";
import type { IAutoMovieHumanPersonDocument } from "./IAutoMovieHumanPersonDocument";
import type { IAutoMovieHumanPersonGenerationBuild } from "./IAutoMovieHumanPersonGenerationBuild";

/**
 * Inputs for the registered person protocol dispatcher: compiled source context, its actual one-skin evaluator, saved person request and body channel naming the instrument. Stature uses source-rest geometry while girth uses the supplied full evaluator after its narrower rest-document preparation. Matching source context/pure evaluator and registered landmark acquisition remain caller/owner premises; target/typed records supply no clinical or current viewer result.
 *
 * @evidence contracts/common.md#principled-implementation Actual compiled generation and matching evaluator address source-owned final geometry for the named person protocol.
 * @evidence contracts/common.md#clear-and-simple-design Four canonical inputs separate protocol identity, document intent and compiled/evaluation owners without embedding another measurement implementation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A callback type alone cannot prove source-context equivalence, and source-rest/full-girth paths are not falsely called identical neutral/clinical measurements.
 * @evidence contracts/common.md#meaningful-documentation Prose distinguishes actual dispatcher routes, source acquisition, metre readout ownership and caller purity/context premises.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This input record runs no evaluation, rest preparation or section traversal; dispatcher/readers own those operations.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Actual trial/result reuse is caller/runtime behavior rather than a cache implemented by these fields.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Declaring context/callbacks acquires no geometry task or worker; containing callers own compiled buffers and evaluator lifetime.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonDocumentMeasurementProps {
  /** The person's compiled generation, whose body view declares the rules' skin points. */
  compiled: IAutoMovieHumanPersonCompiledGeneration;

  /**
   * Evaluate the supplied document against the same unchanged registered source context. Measurement consumers may alter trial shape/rest fields on copied documents; actual evaluator failures propagate and source qualification stays with its owners.
   *
   * @evidence contracts/common.md#principled-implementation One actual matching-generation evaluator supplies performed trial geometry/body landmarks to the person measurement dispatcher.
   * @evidence contracts/common.md#clear-and-simple-design The callable seam returns the canonical generation build while protocols and solving remain independent consumers.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A matching signature does not prove source identity or clinical/readout correctness, and failed geometry is not replaced by a target or proxy.
   * @evidence contracts/common.md#meaningful-documentation Prose states unchanged source context, copied trial/rest requests and observable evaluator failures.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This erased callback executes no build; concrete person geometry owners pay their actual evaluation costs.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Evaluator compilation/reuse belongs to its implementation rather than this callback declaration.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The signature acquires no task or model; actual implementation/caller owners control compiled and returned buffer lifetime.
   */
  build: (
    document: IAutoMovieHumanPersonDocument,
  ) => IAutoMovieHumanPersonGenerationBuild;

  /** The person to measure. */
  document: IAutoMovieHumanPersonDocument;

  /** The body channel id that names the person measurement rule. */
  channel: string;
}
