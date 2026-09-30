import typia from "typia";

import { createPortraitIrisMaterials } from "../anatomy/eye/createPortraitIrisMaterials";
import { assertHumanFaceHair } from "../anatomy/hair/assertHumanFaceHair";
import { createPortraitColourField } from "../anatomy/skin/createPortraitColourField";
import { IAutoMovieHumanFaceBasisDocument } from "../structures/IAutoMovieHumanFaceBasisDocument";

/**
 * Finite scalar admission is shared by loading and saving this flat schema.
 *
 * @author Samchon
 */
export function admitHumanFaceBasisDocument(input: unknown): IAutoMovieHumanFaceBasisDocument {
  const document = typia.assertEquals<IAutoMovieHumanFaceBasisDocument>(input);
  if (document.hair !== undefined && document.hair !== null)
    assertHumanFaceHair(document.hair);
  for (const fields of Object.values(document.skin ?? {}))
    createPortraitColourField(fields);
  // Iris pigments are refused on load and save by the same endpoint check
  // the builder applies, so an invalid colour never reaches a saved file.
  if (document.iris !== undefined && document.iris !== null)
    for (const pigment of [document.iris.left, document.iris.right])
      createPortraitIrisMaterials("iris", pigment);
  const values = [
    ...Object.values(document.shape),
    ...Object.values(document.expression),
  ];
  for (const material of Object.values(document.materials ?? {})) {
    values.push(...Object.values(material.color ?? {}));
    if (material.roughness !== undefined) values.push(material.roughness);
    values.push(...(material.pigment ?? []));
    if (material.density !== undefined) values.push(material.density);
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
