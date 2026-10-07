import type { IAutoMovieHumanPersonConstruction } from "./IAutoMovieHumanPersonConstruction";
import type { IAutoMovieHumanPersonDocument } from "./IAutoMovieHumanPersonDocument";
import type { IAutoMovieHumanPersonGenerationBuild } from "./IAutoMovieHumanPersonGenerationBuild";

/** One source-person geometry owner with ordinary admission and explicit construction inspection.
 *
 * @evidence contracts/common.md#principled-implementation The same composed model and source context feed ordinary and explicit construction entries.
 * @evidence contracts/common.md#clear-and-simple-design One callable and one explicit inspection method share a geometry owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The ordinary entry still refuses every reported admission failure.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes complete construction from admitted authoring output.
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
