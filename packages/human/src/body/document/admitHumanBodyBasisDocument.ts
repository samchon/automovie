import typia from "typia";

import type { IAutoMovieHumanBodyBasisDocument } from "../structures/IAutoMovieHumanBodyBasisDocument";

/**
 * Schema and finite-scalar admission shared by loading and saving a body
 * document.
 *
 * Parsing admits the shape of the record and the finiteness of every number
 * it carries (weights, identity rows, pose angles, material scalars) and the
 * nonemptiness of its identities. Whether a channel, surface or joint exists
 * in the basis and whether a value lies in range is the compiled basis's
 * decision (`createHumanBodyBasisBuilder`), which is why a document can be
 * saved against a basis the editor has not loaded and still be refused later
 * for the right reason. A pose that names one bone twice is refused here,
 * because no basis makes that meaningful.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-document Refuses nonfinite numbers, empty identities and duplicate pose bones at both the load and the save boundary.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-document Performs the schema and finiteness admission the specification assigns to parsing, leaving membership and range to the compiled basis.
 */
export function admitHumanBodyBasisDocument(
  input: unknown,
): IAutoMovieHumanBodyBasisDocument {
  const document = typia.assertEquals<IAutoMovieHumanBodyBasisDocument>(input);
  const values = [
    ...Object.values(document.shape),
    ...Object.values(document.identity ?? {}).flat(),
  ];
  for (const joint of document.pose ?? [])
    for (const angle of [joint.flexion, joint.abduction, joint.twist])
      if (angle !== null) values.push(angle);
  for (const material of Object.values(document.materials ?? {})) {
    values.push(...Object.values(material.color ?? {}));
    if (material.roughness !== undefined) values.push(material.roughness);
  }
  const bones = (document.pose ?? []).map((joint) => joint.bone);
  if (
    !values.every(Number.isFinite) ||
    [document.id, document.name, document.basis].some(
      (id) => id.trim() === "",
    ) ||
    new Set(bones).size !== bones.length
  )
    throw new Error(
      "Body edits need finite numbers, nonempty identities and one entry per posed bone.",
    );
  return document;
}
