import type { IAutoMovieHumanFaceDetailChannel as IAutoMovieHumanFaceDetailChannelImported } from "../../index";
import { assertHumanFaceEditableDetail } from "../document/assertHumanFaceEditableDetail";
import { IAutoMovieHumanFaceDocument } from "../structures/IAutoMovieHumanFaceDocument";
import { assertDetailValue } from "./assertDetailValue";
import { humanFaceDetailDefinition } from "./humanFaceDetailDefinition";
import { writeHumanFaceDetail } from "./writeHumanFaceDetail";

/**
 * Write or remove one exact scalar override without flattening the rest of a
 * profile into explicit values. Subsequent trait edits retain every other edit.
 * Removal never creates a missing path. Empty ancestors of the removed leaf
 * return to omission, so an inherited optional component stays optional.
 * Shared authored objects are detached along the edited path, so neither a
 * write nor removal can alter another owner through a caller-supplied alias.
 *
 * @evidence contracts/common.md#principled-implementation Shared immutable-detail and scalar-domain admission precede one catalogue path edit on a document clone; explicit paired side ownership determines detail versus asymmetry. Undefined clearing removes the leaf/empty ancestors without flattening inherited fields.
 * @evidence contracts/common.md#clear-and-simple-design Catalogue lookup, numeric admission and alias-safe path mutation remain shared owners; this transaction selects the current profile path and copies the document.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unknown channels, invalid paired sides and inadmissible values refuse instead of clamping/defaulting. A valid scalar edit still needs combined component/model admission before publication.
 * @evidence contracts/common.md#meaningful-documentation Prose gives exact override versus applied value, clearing, inherited optionality and alias detachment; inputs remain unchanged and output is owned.
 * @evidence contracts/performance.md#efficient-algorithms Full document clone/admission and catalogue search precede D path steps with shallow container copies; ancestor key scans on clearing and source-guide checks remain part of total work.
 * @evidence contracts/performance.md#reuse-equivalent-work This editor shares definitions/admission/path semantics with the reader and hair-layer transaction; each edit receives fresh owned settings and no admission result is cached across mutations.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The cloned edited document transfers; path/lookup temporaries are local and this function owns no builder, history, worker or renderer handle.
 */
export function setHumanFaceDetail(
  document: IAutoMovieHumanFaceDocument,
  id: string,
  value: number | undefined,
  side?: "right" | "left",
): IAutoMovieHumanFaceDocument {
  assertHumanFaceEditableDetail(document);
  const definition: IAutoMovieHumanFaceDetailChannelImported =
    humanFaceDetailDefinition(id);
  assertDetailValue(definition, value);
  if (
    side !== undefined &&
    (!definition.paired || (side !== "right" && side !== "left"))
  )
    throw new Error("This detail does not have that independent side owner.");
  const next: IAutoMovieHumanFaceDocument = structuredClone(document);
  const path: string[] = [
    ...(side === undefined ? ["detail"] : ["asymmetry", side]),
    definition.region,
    ...definition.path,
  ];
  return writeHumanFaceDetail(next, path, value);
}
