import type { IAutoMovieHumanPersonCompiledGeneration } from "./IAutoMovieHumanPersonCompiledGeneration";
import type { IAutoMovieHumanPersonDocument } from "./IAutoMovieHumanPersonDocument";
import type { IAutoMovieHumanPersonGenerationBuild } from "./IAutoMovieHumanPersonGenerationBuild";

/**
 * Inputs of `solveHumanPersonMeasuredChannel`: the compiled generation and the one-skin evaluator built from it, the person, the body channel to solve and the target.
 *
 * @evidence contracts/common.md#principled-implementation One body channel identifies a whole-person instrument, while the supplied evaluator must come from the same compiled generation used for reach and measurement.
 * @evidence contracts/common.md#clear-and-simple-design The solve input keeps source, evaluator, document, channel and metre target explicit instead of hiding a global person builder.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Only the selected body channel changes; the input exposes no compensating second channel to conceal an unreachable target.
 * @evidence contracts/common.md#meaningful-documentation Documentation identifies evaluator provenance, preserved document values, rule-naming channel and metre target.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The single-channel whole-person measurement solve operands specify data and signatures; numerical producers own their traversal strategy.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Request equivalence is not implemented by the single-channel whole-person measurement solve operands; consuming operations decide dependency-sensitive reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The single-channel whole-person measurement solve operands acquire no external resource or running task; their containing value owns ordinary data retention.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonMeasuredChannelProps {
  /** The compiled generation the evaluator was built from. */
  compiled: IAutoMovieHumanPersonCompiledGeneration;

  /**
   * The one-skin evaluator of that same compiled generation, used for girth trials at rest. Stature trials use the compiled rest-skin reader instead of this callback. The admitted evaluator preserves the supplied document; invalid source or geometry states may refuse.
   *
   * @evidence contracts/common.md#principled-implementation Girth trials read a rest-document whole-person build from the same compiled source used for channel reach; stature trials bypass this callback and read the compiled rest-skin instrument.
   * @evidence contracts/common.md#clear-and-simple-design Supplying the existing one-skin evaluator keeps measurement inversion independent of builder initialization and source loading.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Trial evaluation reads actual final geometry rather than returning the requested target or a fixture-specific measurement.
   * @evidence contracts/common.md#meaningful-documentation The member states matching generation provenance, girth-only use, stature bypass, document-preservation premise and possible admission refusal.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The trial-builder signature selects no skin algorithm; the supplied generation builder owns each numerical evaluation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Trial document equivalence depends on the generation builder's complete shape and pose inputs; this callback declaration implements no cache.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The trial-builder type acquires no generation assets or handles; its caller retains compiled source and returned builds.
   */
  build: (
    document: IAutoMovieHumanPersonDocument,
  ) => IAutoMovieHumanPersonGenerationBuild;

  /** The person to solve from; only its body channel changes. */
  document: IAutoMovieHumanPersonDocument;

  /** The body channel id, which also names the person measurement rule. */
  channel: string;

  /** The target value, metres. */
  targetMetres: number;
}
