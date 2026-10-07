import type { IAutoMovieHumanBodyAnatomicalAssembly } from "../../body/anatomy/assembly/IAutoMovieHumanBodyAnatomicalAssembly";
import { assertTextSize } from "../../common/document/assertTextSize";
import type { IAutoMovieHumanPersonDocument } from "../structures/IAutoMovieHumanPersonDocument";
import { admitHumanPersonDocument } from "./admitHumanPersonDocument";

/**
 * Serialize a person, admitting it first so JSON cannot turn a nonfinite
 * number into null, and measuring the formatted text against the loader's
 * envelope so a document that saves also loads.
 *
 * @evidence contracts/common.md#principled-implementation Admission precedes serialization because JSON.stringify would silently write NaN as null, and the size check is on the exact text a loader will read.
 * @evidence contracts/common.md#clear-and-simple-design Admit, stringify, measure.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Nothing is dropped or rounded on the way out.
 * @evidence contracts/common.md#meaningful-documentation The comment states why the order matters.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function writes a document and defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no primitive.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The function carries no unit or frame.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function displays nothing.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range Ranges belong to the compiled bases.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function adds no input.
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
