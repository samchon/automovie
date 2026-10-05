import type {
  IAutoMovieHumanPersonCompiledGeneration,
  IAutoMovieHumanPersonDocument,
  IAutoMovieHumanPersonGenerationBuild,
} from "@automovie/human";

/**
 * A compiled person generation and the one-skin evaluator built from it.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Carries the compiled generation that evaluates the person's body with its face.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-measurements Supplies the one-skin evaluator person measurements are read on.
 * @author Samchon
 */
export interface IConnectedPersonEvaluator {
  /** The compiled generation. */
  compiled: IAutoMovieHumanPersonCompiledGeneration;

  /** Evaluate a person document on that generation. */
  build: (document: IAutoMovieHumanPersonDocument) => IAutoMovieHumanPersonGenerationBuild;
}
