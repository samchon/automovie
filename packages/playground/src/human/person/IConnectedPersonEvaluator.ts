import type {
  IAutoMovieHumanPersonDocument,
  IAutoMovieHumanPersonGeneration,
  IAutoMovieHumanPersonGenerationBuild,
} from "@automovie/human";

/**
 * A joined person generation and the one-skin evaluator compiled from it.
 *
 * @author Samchon
 */
export interface IConnectedPersonEvaluator {
  /** The joined generation. */
  generation: IAutoMovieHumanPersonGeneration;

  /** Evaluate a person document on that generation. */
  build: (document: IAutoMovieHumanPersonDocument) => IAutoMovieHumanPersonGenerationBuild;
}
