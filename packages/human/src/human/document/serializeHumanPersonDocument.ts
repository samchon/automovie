import type { IAutoMovieHumanBodyAnatomicalAssembly } from "../../body/anatomy/assembly/IAutoMovieHumanBodyAnatomicalAssembly";
import { assertTextSize } from "../../common/document/assertTextSize";
import type { IAutoMovieHumanPersonDocument } from "../structures/IAutoMovieHumanPersonDocument";
import { admitHumanPersonDocument } from "./admitHumanPersonDocument";

/**
 * Serialize a person, admitting it first so JSON cannot turn a nonfinite
 * number into null, and measuring the formatted text against the loader's
 * envelope so a document that saves also loads.
 */
export function serializeHumanPersonDocument(
  document: IAutoMovieHumanPersonDocument,
  bodySource?: IAutoMovieHumanBodyAnatomicalAssembly,
): string {
  const text = JSON.stringify(
    admitHumanPersonDocument(document, bodySource),
    null,
    2,
  );
  assertTextSize(text);
  return text;
}
