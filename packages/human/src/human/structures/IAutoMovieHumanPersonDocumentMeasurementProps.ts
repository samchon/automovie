import type { IAutoMovieHumanPersonCompiledGeneration } from "./IAutoMovieHumanPersonCompiledGeneration";
import type { IAutoMovieHumanPersonDocument } from "./IAutoMovieHumanPersonDocument";
import type { IAutoMovieHumanPersonGenerationBuild } from "./IAutoMovieHumanPersonGenerationBuild";

/**
 * Inputs of `measureHumanPersonDocument`: the compiled generation, its
 * one-skin evaluator, the person and the body channel that names the
 * measurement.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonDocumentMeasurementProps {
  /** The person's compiled generation, whose body view declares the rules' skin points. */
  compiled: IAutoMovieHumanPersonCompiledGeneration;

  /**
   * The one-skin evaluator of the person's generation.
   */
  build: (
    document: IAutoMovieHumanPersonDocument,
  ) => IAutoMovieHumanPersonGenerationBuild;

  /** The person to measure. */
  document: IAutoMovieHumanPersonDocument;

  /** The body channel id that names the person measurement rule. */
  channel: string;
}
