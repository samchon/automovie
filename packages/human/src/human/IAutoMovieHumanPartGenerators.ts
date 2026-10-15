import { AutoMovieHumanPart } from "../junction/AutoMovieHumanPart";
import { IAutoMovieHumanPartGenerator } from "../parts/IAutoMovieHumanPartGenerator";

/**
 * One generator per skin part: the set a person is built from.
 *
 * @author Samchon
 */
export type IAutoMovieHumanPartGenerators = {
  readonly [Part in AutoMovieHumanPart]: IAutoMovieHumanPartGenerator<Part>;
};
