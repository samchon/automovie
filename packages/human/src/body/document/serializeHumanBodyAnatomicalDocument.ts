import { assertTextSize } from "../../common/document/assertTextSize";
import type { IAutoMovieHumanBodyAnatomicalDocument } from "../structures/IAutoMovieHumanBodyAnatomicalDocument";
import { admitHumanBodyAnatomicalDocument } from "./admitHumanBodyAnatomicalDocument";

/**
 * Save the numerical request, including unknown omissions and acquisition context.
 *
 * @evidence contracts/common.md#principled-implementation Admission precedes JSON conversion so nonfinite values cannot silently become null, and the loader's text budget is checked on the escaped output.
 * @evidence contracts/common.md#clear-and-simple-design Reuses the one request-admission and text-budget owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No cached geometry or reference weights are inserted into saved requests.
 * @evidence contracts/common.md#meaningful-documentation Names the preserved request meaning and shared loader budget.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping It saves a request, not a part.
 * @evidenceExclude contracts/modeling.md#parameter-channels It changes no target or observation.
 * @evidenceExclude contracts/modeling.md#emitted-geometry It emits no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions It serializes without unit conversion.
 * @evidenceExclude contracts/modeling.md#shared-boundaries It constructs no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation It owns no displayed output.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The canonical measurement owners define the saved values.
 * @evidenceExclude contracts/anatomy.md#permitted-range Admission owns supported values.
 * @evidenceExclude contracts/anatomy.md#parametric-authority It introduces no new authored quantity.
 */
export function serializeHumanBodyAnatomicalDocument(document: IAutoMovieHumanBodyAnatomicalDocument): string {
  const text = JSON.stringify(admitHumanBodyAnatomicalDocument(document), null, 2);
  assertTextSize(text);
  return text;
}
