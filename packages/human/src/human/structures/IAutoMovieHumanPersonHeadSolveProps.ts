import type { IAutoMovieHumanPersonCompiledGeneration } from "./IAutoMovieHumanPersonCompiledGeneration";
import type { IAutoMovieHumanPersonDocument } from "./IAutoMovieHumanPersonDocument";

/**
 * Inputs of `solveHumanPersonHead`: the compiled generation, the person, a
 * target in metres for every head measurement the solve meets and, optionally,
 * for each it pursues second.
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
