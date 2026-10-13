import type {
  IAutoMovieHumanPersonCompiledGeneration,
  IAutoMovieHumanPersonDocument,
  IAutoMovieHumanPersonGenerationBuild,
} from "@automovie/human";

/**
 * A compiled person generation and the one-skin evaluator built from it.
 *
 * @author Samchon
 */
export interface IConnectedPersonEvaluator {
  /** The compiled generation. */
  compiled: IAutoMovieHumanPersonCompiledGeneration;

  /** Evaluate a person document on that generation. */
  build: (
    document: IAutoMovieHumanPersonDocument,
  ) => IAutoMovieHumanPersonGenerationBuild;
}
