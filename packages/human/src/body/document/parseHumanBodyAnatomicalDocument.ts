import { assertTextSize } from "../../common/document/assertTextSize";
import type { IAutoMovieHumanBodyAnatomicalDocument } from "../structures/IAutoMovieHumanBodyAnatomicalDocument";
import { admitHumanBodyAnatomicalDocument } from "./admitHumanBodyAnatomicalDocument";

/**
 * Read a numerical request using the shared UTF-16 text envelope.
 *
 * @evidence contracts/common.md#principled-implementation The same text budget as saving runs before JSON parsing and exact request admission.
 * @evidence contracts/common.md#clear-and-simple-design Delegates physical meaning and revision to the admitted-document owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Parsing does not reconstruct a missing skin or drop unsupported keys.
 * @evidence contracts/common.md#meaningful-documentation Identifies the text envelope and canonical admission route.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping It transports a request, not a part.
 * @evidenceExclude contracts/modeling.md#parameter-channels It changes no measurement.
 * @evidenceExclude contracts/modeling.md#emitted-geometry It emits no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions It converts text only.
 * @evidenceExclude contracts/modeling.md#shared-boundaries It constructs no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation It owns no displayed output.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Measurement definitions remain with the admitted document.
 * @evidenceExclude contracts/anatomy.md#permitted-range The admission owner decides supported values.
 * @evidenceExclude contracts/anatomy.md#parametric-authority It introduces no authored quantity.
 */
export function parseHumanBodyAnatomicalDocument(text: string): IAutoMovieHumanBodyAnatomicalDocument {
  assertTextSize(text);
  return admitHumanBodyAnatomicalDocument(JSON.parse(text));
}
