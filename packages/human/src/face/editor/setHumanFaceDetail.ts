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
 */
export function setHumanFaceDetail(
  document: IAutoMovieHumanFaceDocument,
  id: string,
  value: number | undefined,
  side?: "right" | "left",
): IAutoMovieHumanFaceDocument {
  assertHumanFaceEditableDetail(document);
  const definition = humanFaceDetailDefinition(id);
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
  return writeHumanFaceDetail(next, path, value);
}
