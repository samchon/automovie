import { IAutoMovieHumanFaceDocument } from "../structures/IAutoMovieHumanFaceDocument";
import { assertDetailValue } from "./assertDetailValue";
import { definitionOf } from "./definitionOf";
import { writeDetail } from "./writeDetail";

/**
 * Write or remove one exact scalar override without flattening the rest of a
 * profile into explicit values. Subsequent trait edits retain every other edit.
 * Removal never creates a missing path. Empty ancestors of the removed leaf
 * return to omission, so an inherited optional component stays optional.
 * Shared authored objects are detached along the edited path, so neither a
 * write nor removal can alter another owner through a caller-supplied alias.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-controls-replacement Separates one user detail from inherited settings and independent sides.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-controls Preserves override intent rather than serializing a derived combined profile.
 */
export function setHumanFaceDetail(
  document: IAutoMovieHumanFaceDocument,
  id: string,
  value: number | undefined,
  side?: "right" | "left",
): IAutoMovieHumanFaceDocument {
  const definition = definitionOf(id);
  assertDetailValue(definition, value);
  if (
    side !== undefined &&
    (!definition.paired || (side !== "right" && side !== "left"))
  )
    throw new Error("This detail does not have that independent side owner.");
  const next = structuredClone(document);
  const path = [
    ...(side === undefined ? ["detail"] : ["asymmetry", side]),
    definition.region,
    ...definition.path,
  ];
  return writeDetail(next, path, value);
}
