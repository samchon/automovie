import type { IAutoMovieHumanBodyAnatomicalAssembly } from "../../body/anatomy/assembly/IAutoMovieHumanBodyAnatomicalAssembly";
import { assertTextSize } from "../../common/document/assertTextSize";
import type { IAutoMovieHumanPersonDocument } from "../structures/IAutoMovieHumanPersonDocument";
import { admitHumanPersonDocument } from "./admitHumanPersonDocument";

/**
 * Load a person document from text within the shared envelope (16,777,216
 * UTF-16 code units, the limit the face and body editors share), admitting the
 * record before any worker allocates for it.
 */
export function parseHumanPersonDocument(
  text: string,
  bodySource?: IAutoMovieHumanBodyAnatomicalAssembly,
): IAutoMovieHumanPersonDocument {
  assertTextSize(text);
  return admitHumanPersonDocument(JSON.parse(text), bodySource);
}
