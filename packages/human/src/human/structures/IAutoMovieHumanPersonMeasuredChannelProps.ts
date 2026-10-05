import type { IAutoMovieHumanPersonDocument } from "./IAutoMovieHumanPersonDocument";
import type { IAutoMovieHumanPersonCompiledGeneration } from "./IAutoMovieHumanPersonCompiledGeneration";
import type { IAutoMovieHumanPersonGenerationBuild } from "./IAutoMovieHumanPersonGenerationBuild";

/**
 * Inputs of `solveHumanPersonMeasuredChannel`: the compiled generation and the one-skin
 * evaluator built from it, the person, the body channel to solve and the
 * target.
 *
 * @evidence contracts/common.md#principled-implementation The caller owns the evaluator, so repeated solves reuse one compiled generation.
 * @evidence contracts/common.md#clear-and-simple-design Five fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The compiled generation is passed so the solver can refuse a channel the head view does not carry.
 * @evidence contracts/common.md#meaningful-documentation States what each field is.
 * @evidence contracts/modeling.md#parameter-channels Names the one body channel the solve changes.
 * @evidence contracts/modeling.md#spatial-conventions The target is metres.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The props define no part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The props emit no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The props build no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The props are not displayed.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The measurement rule owns the source.
 * @evidenceExclude contracts/anatomy.md#permitted-range The solver's inverse owns the reach.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The solver converts the target; the props only carry it.
 * @author Samchon
 */
export interface IAutoMovieHumanPersonMeasuredChannelProps {
  /** The compiled generation the evaluator was built from. */
  compiled: IAutoMovieHumanPersonCompiledGeneration;

  /**
   * The one-skin evaluator of that generation.
   *
   * @evidence contracts/common.md#principled-implementation The solver evaluates trials on the caller's compiled evaluator, never a second one.
   * @evidence contracts/common.md#clear-and-simple-design One document in, one build out.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Each trial is the actual person build, not a surrogate surface.
   * @evidence contracts/common.md#meaningful-documentation States which evaluator it is.
   * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The evaluator owns the parts it builds.
   * @evidenceExclude contracts/modeling.md#parameter-channels The evaluator owns channel evaluation.
   * @evidenceExclude contracts/modeling.md#emitted-geometry The evaluator owns the geometry it emits.
   * @evidenceExclude contracts/modeling.md#spatial-conventions The evaluator owns its frame.
   * @evidenceExclude contracts/modeling.md#shared-boundaries The evaluator owns the boundary.
   * @evidenceExclude contracts/modeling.md#rendered-observation The member displays nothing.
   * @evidenceExclude contracts/anatomy.md#anatomical-source The member carries no anatomical value.
   * @evidenceExclude contracts/anatomy.md#permitted-range The member admits nothing.
   * @evidenceExclude contracts/anatomy.md#parametric-authority The member converts no input.
   */
  build: (document: IAutoMovieHumanPersonDocument) => IAutoMovieHumanPersonGenerationBuild;

  /** The person to solve from; only its body channel changes. */
  document: IAutoMovieHumanPersonDocument;

  /** The body channel id, which also names the person measurement rule. */
  channel: string;

  /** The target value, metres. */
  targetMetres: number;
}
