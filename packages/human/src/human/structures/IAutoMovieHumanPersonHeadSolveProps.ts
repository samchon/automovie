import type { IAutoMovieHumanPersonCompiledGeneration } from "./IAutoMovieHumanPersonCompiledGeneration";
import type { IAutoMovieHumanPersonDocument } from "./IAutoMovieHumanPersonDocument";

/**
 * Inputs of `solveHumanPersonHead`: the compiled generation, the person, a target in metres for every head measurement the solve meets and, optionally, for each it pursues second.
 *
 * @evidence contracts/common.md#principled-implementation Compiled generation rules define the points and areas used for each metre target; the solver changes only its declared head channels.
 * @evidence contracts/common.md#clear-and-simple-design Compiled source, starting document and target map are the complete inputs while solve policy remains in the head-solve table.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Targets must correspond to declared primary or optional secondary measurements rather than silently introducing an unsupported instrument.
 * @evidence contracts/common.md#meaningful-documentation Documentation states compiled rule provenance, preserved non-head values and required versus optional measurement targets in metres.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The head solve source, document and metre targets specify data and signatures; numerical producers own their traversal strategy.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Request equivalence is not implemented by the head solve source, document and metre targets; consuming operations decide dependency-sensitive reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The head solve source, document and metre targets acquire no external resource or running task; their containing value owns ordinary data retention.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonHeadSolveProps {
  /** The person's compiled generation, whose head view declares the rules' points and areas. */
  compiled: IAutoMovieHumanPersonCompiledGeneration;

  /** The person to solve; the solve sets its head channels and keeps every other value. */
  document: IAutoMovieHumanPersonDocument;

  /** Target in metres per met measurement of `HUMAN_PERSON_HEAD_SOLVE`, and optionally per secondary one. */
  targets: Record<string, number>;
}
