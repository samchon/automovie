import type { IAutoMovieHumanPersonCompiledGeneration } from "./IAutoMovieHumanPersonCompiledGeneration";
import type { IAutoMovieHumanPersonDocument } from "./IAutoMovieHumanPersonDocument";
import type { IAutoMovieHumanPersonGenerationBuild } from "./IAutoMovieHumanPersonGenerationBuild";

/**
 * Inputs of `solveHumanPersonMeasuredChannel`: the compiled generation and the one-skin
 * evaluator built from it, the person, the body channel to solve and the
 * target.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonMeasuredChannelProps {
  /** The compiled generation the evaluator was built from. */
  compiled: IAutoMovieHumanPersonCompiledGeneration;

  /**
   * The one-skin evaluator of that generation.
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
