import typia from "typia";

import { createPortraitIrisMaterials } from "../anatomy/eye/createPortraitIrisMaterials";
import { assertHumanFaceHair } from "../anatomy/hair/assertHumanFaceHair";
import { createPortraitColourField } from "../anatomy/skin/createPortraitColourField";
import { IAutoMovieHumanFaceBasisDocument } from "../structures/IAutoMovieHumanFaceBasisDocument";

/**
 * Finite scalar admission is shared by loading and saving this flat schema.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-connected-basis Loads independent numerical edits while refusing unknown fields and invalid scalar values.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-connected-basis Admits the compact document schema without changing its basis identity or supplied controls.
 * @author Samchon
 */
export function admit(input: unknown): IAutoMovieHumanFaceBasisDocument {
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
