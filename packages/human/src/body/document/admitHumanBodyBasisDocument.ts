import typia from "typia";

import type { IAutoMovieHumanBodyBasisDocument } from "../structures/IAutoMovieHumanBodyBasisDocument";

/**
 * Schema and finite-scalar admission shared by loading and saving a body
 * document.
 *
 * Parsing admits the shape of the record and the finiteness of every number
 * it carries (named weights, generic pose angles, TT shoulder goals, the skin's cheek albedo and detail strength, material scalars) and the
 * nonemptiness of its identifiers. Whether a channel or joint exists
 * in the basis and whether a value lies in range is the compiled basis's
 * decision (`createHumanBodyBasisBuilder`), which is why a document can be
 * saved against a basis the editor has not loaded and still be refused later
 * for the right reason. Exact schema admission refuses legacy per-vertex
 * identity rows and generic upper-arm Euler poses instead of dropping or
 * reinterpreting them. Duplicate shoulder and generic pose bones refuse here.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-document Refuses nonfinite numbers, empty identifiers and duplicate pose bones at both the load and the save boundary.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-document Performs the schema and finiteness admission the specification assigns to parsing, leaving membership and range to the compiled basis.
 */
export function admitHumanBodyBasisDocument(
  input: unknown,
): IAutoMovieHumanBodyBasisDocument {
  const document = typia.assertEquals<IAutoMovieHumanBodyBasisDocument>(input);
  const values = [...Object.values(document.shape)];
  for (const joint of document.pose ?? [])
    for (const angle of [joint.flexion, joint.abduction, joint.twist])
      if (angle !== null) values.push(angle);
  for (const shoulder of document.shoulders ?? [])
    values.push(shoulder.plane, shoulder.elevation, shoulder.axialRotation);
  if (document.skinColour !== undefined)
    values.push(...Object.values(document.skinColour.cheek));
  if (document.skinDetail !== undefined)
    values.push(document.skinDetail.strength);
  if (document.skinTone !== undefined) values.push(document.skinTone.strength);
  for (const material of Object.values(document.materials ?? {})) {
    values.push(...Object.values(material.color ?? {}));
    if (material.roughness !== undefined) values.push(material.roughness);
  }
  const bones = (document.pose ?? []).map((joint) => joint.bone);
  const shoulderBones = (document.shoulders ?? []).map((one) => one.bone);
  if (
    !values.every(Number.isFinite) ||
    [document.id, document.name, document.basis].some(
      (id) => id.trim() === "",
    ) ||
    new Set(bones).size !== bones.length ||
    bones.some((bone) => bone === "leftUpperArm" || bone === "rightUpperArm") ||
    new Set(shoulderBones).size !== shoulderBones.length ||
    (document.shoulders ?? []).some(
      (one) => one.plane < -180 || one.plane >= 180,
    )
  )
    throw new Error(
      "Body edits need finite numbers, nonempty identities, unique bones, shoulder goals in thorax-tt coordinates and canonical planes.",
    );
  return document;
}
