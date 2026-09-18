import typia from "typia";
import type { IAutoMovieHumanFaceBasisDocument } from "../structures/IAutoMovieHumanFaceBasisDocument";

/**
 * Serialize the last valid document, keeping geometry in its immutable basis.
 * Admission occurs before JSON can convert a nonfinite number to null.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-connected-basis Saves replayable shape, expression and material edits independently of source geometry.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-connected-basis Preserves the exact basis revision and finite authored values on save.
 */
export function serializeHumanFaceBasisDocument(
  document: IAutoMovieHumanFaceBasisDocument,
): string {
  const text = JSON.stringify(admit(document), null, 2);
  // Measure the actual escaped, formatted representation. Otherwise a valid
  // in-memory edit could save successfully but exceed the loader's envelope.
  assertTextSize(text);
  return text;
}

/** Loading and saving share a UTF-16 envelope, including JSON whitespace. */
function assertTextSize(text: string): void {
  if (text.length > 16 * 1024 * 1024)
    throw new Error(
      "Face documents must fit within 16,777,216 UTF-16 code units.",
    );
}

/** Finite scalar admission is shared by loading and saving this flat schema. */
function admit(input: unknown): IAutoMovieHumanFaceBasisDocument {
  const document = typia.assertEquals<IAutoMovieHumanFaceBasisDocument>(input);
  const values = [
    ...Object.values(document.shape),
    ...Object.values(document.expression),
  ];
  for (const material of Object.values(document.materials ?? {})) {
    values.push(...Object.values(material.color ?? {}));
    if (material.roughness !== undefined) values.push(material.roughness);
  }
  if (
    !values.every(Number.isFinite) ||
    [document.id, document.name, document.basis].some((id) => id.trim() === "")
  )
    throw new Error(
      "Facial edits need finite numbers and nonempty identities.",
    );
  return document;
}
