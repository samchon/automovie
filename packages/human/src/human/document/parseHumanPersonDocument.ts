import { assertTextSize } from "../../common/document/assertTextSize";
import type { IAutoMovieHumanBodyAnatomicalAssembly } from "../../body/anatomy/assembly/IAutoMovieHumanBodyAnatomicalAssembly";
import type { IAutoMovieHumanPersonDocument } from "../structures/IAutoMovieHumanPersonDocument";
import { admitHumanPersonDocument } from "./admitHumanPersonDocument";

/**
 * Load a person document from text within the shared envelope (16,777,216
 * UTF-16 code units, the limit the face and body editors share), admitting the
 * record before any worker allocates for it.
 *
 * @evidence contracts/common.md#principled-implementation The size check precedes parsing, so an oversized text never reaches the parser, and admission follows it.
 * @evidence contracts/common.md#clear-and-simple-design Envelope, parse, admit.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No field is defaulted or migrated; a document for another basis is refused by the builder.
 * @evidence contracts/common.md#meaningful-documentation The comment states the envelope and the order.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function loads a document and defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no primitive.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The function carries no unit or frame.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function displays nothing.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range Ranges belong to the compiled bases.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function adds no input.
 */
export function parseHumanPersonDocument(
  text: string,
  bodySource?: IAutoMovieHumanBodyAnatomicalAssembly,
): IAutoMovieHumanPersonDocument {
  assertTextSize(text);
  return admitHumanPersonDocument(JSON.parse(text), bodySource);
}
