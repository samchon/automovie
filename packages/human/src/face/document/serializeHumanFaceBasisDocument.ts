import { assertTextSize } from "../../common/document/assertTextSize";
import type { IAutoMovieHumanFaceBasisDocument } from "../structures/IAutoMovieHumanFaceBasisDocument";
import { admitHumanFaceBasisDocument } from "./admitHumanFaceBasisDocument";

/**
 * Serialize the last valid document, keeping geometry in its immutable basis.
 * Admission occurs before JSON can convert a nonfinite number to null.
 *
 * @evidence contracts/common.md#principled-implementation Shared exact/profile/finite admission precedes JSON.stringify, then the actual escaped formatted text meets the loader's UTF-16 envelope. This preserves load/save scalar semantics without claiming compiled source or model validity.
 * @evidence contracts/common.md#clear-and-simple-design One shared document boundary and text-size owner surround standard JSON serialization; no mesh/image cache or separate save schema is added.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Nonfinite input cannot become saved null, and emitted whitespace/escaping counts toward the actual size limit. Failed admission/serialization propagates rather than saving an altered fallback document.
 * @evidence contracts/common.md#meaningful-documentation Prose gives immutable-basis separation, admission-before-JSON and actual representation sizing; returned text belongs to the caller and inputs remain unchanged.
 * @evidence contracts/performance.md#efficient-algorithms Serialization follows actual admitted fields and formatted output length plus profile-owner work; final stored string-length checking is constant time. No source geometry is constructed.
 * @evidence contracts/performance.md#reuse-equivalent-work Loading and saving share admission/size rules; mutable document values are inspected afresh rather than cached under an old successful save.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The formatted string transfers on success; temporary profile products are local and no file write, buffer history or external handle is retained.
 */
export function serializeHumanFaceBasisDocument(
  document: IAutoMovieHumanFaceBasisDocument,
): string {
  const text: string = JSON.stringify(
    admitHumanFaceBasisDocument(document),
    null,
    2,
  );
  // Measure the actual escaped, formatted representation. Otherwise a valid
  // in-memory edit could save successfully but exceed the loader's envelope.
  assertTextSize(text);
  return text;
}
