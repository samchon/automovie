import typia from "typia";

import type { IAutoMovieHumanFaceBasisDocument } from "./IAutoMovieHumanFaceBasis";

/**
 * Load compact connected-basis edits without resolving an asset or photograph.
 * Schema and finite-number admission precede worker allocation in the browser.
 * The compiled basis separately owns channel names, ranges and model admission.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-connected-basis Loads independent numerical edits while refusing unknown fields and invalid scalar values.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-connected-basis Admits the compact document schema without changing its basis identity or supplied controls.
 */
export function parseHumanFaceBasisDocument(
  text: string,
): IAutoMovieHumanFaceBasisDocument {
  if (text.length > 16 * 1024 * 1024)
    throw new Error(
      "Face documents must fit within 16,777,216 UTF-16 code units.",
    );
  return admit(JSON.parse(text));
}

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
  return JSON.stringify(admit(document), null, 2);
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
