import type { IAutoMovieHumanPersonConstruction } from "./IAutoMovieHumanPersonConstruction";
import type { IAutoMovieHumanPersonDocument } from "./IAutoMovieHumanPersonDocument";
import type { IAutoMovieHumanPersonGenerationBuild } from "./IAutoMovieHumanPersonGenerationBuild";

/** One source-person geometry owner with ordinary admission and explicit construction inspection.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonGenerationBuilder {
  /** Ordinary authoring result; every unchanged admission condition must succeed. */
  (
    document: IAutoMovieHumanPersonDocument,
  ): IAutoMovieHumanPersonGenerationBuild;

  /** Complete owned body/face/bones/source context with named admission refusals. */
  construct(
    document: IAutoMovieHumanPersonDocument,
  ): IAutoMovieHumanPersonConstruction;
}
