import typia from "typia";

import type { IAutoMovieHumanBodyBasisDocument } from "../structures/IAutoMovieHumanBodyBasisDocument";

/**
 * Schema and finite-scalar admission shared by loading and saving a body
 * document.
 *
 * Parsing admits the shape of the record, nonempty identifiers and finite
 * numbers it carries: named weights, positive measured humeral-head radii in
 * millimetres, generic pose angles, TT shoulder goals, skin colour and detail
 * strength, underwear colour, and material scalars. Whether a channel or
 * joint exists
 * in the basis and whether a value lies in range is the compiled basis's
 * decision (`createHumanBodyBasisBuilder`), which is why a document can be
 * saved against a basis the editor has not loaded and still be refused later
 * for the right reason. Exact schema admission refuses legacy per-vertex
 * identity rows and generic upper-arm Euler poses instead of dropping or
 * reinterpreting them. Duplicate shoulder and generic pose bones refuse here.
 */
export function admitHumanBodyBasisDocument(
  input: unknown,
): IAutoMovieHumanBodyBasisDocument {
  const document = typia.assertEquals<IAutoMovieHumanBodyBasisDocument>(input);
  const values = [...Object.values(document.shape)];
  if (document.humeralHeads !== undefined)
    values.push(...Object.values(document.humeralHeads));
  for (const joint of document.pose ?? [])
    for (const angle of [joint.flexion, joint.abduction, joint.twist])
      if (angle !== null) values.push(angle);
  for (const shoulder of document.shoulders ?? [])
    values.push(shoulder.plane, shoulder.elevation, shoulder.axialRotation);
  for (const goal of document.thighGoals ?? [])
    values.push(goal.flexion, goal.abduction, goal.twist);
  if (document.skinColour !== undefined)
    values.push(...Object.values(document.skinColour.cheek));
  if (document.skinDetail !== undefined)
    values.push(document.skinDetail.strength);
  if (document.skinTone !== undefined) values.push(document.skinTone.strength);
  if (document.skinVeins !== undefined)
    values.push(document.skinVeins.strength);
  if (document.underwear?.color !== undefined)
    values.push(...Object.values(document.underwear.color));
  for (const material of Object.values(document.materials ?? {})) {
    values.push(...Object.values(material.color ?? {}));
    if (material.roughness !== undefined) values.push(material.roughness);
  }
  const bones = (document.pose ?? []).map((joint) => joint.bone);
  const shoulderBones = (document.shoulders ?? []).map((one) => one.bone);
  const goalBones = (document.thighGoals ?? []).map((one) => one.bone);
  if (
    !values.every(Number.isFinite) ||
    (document.humeralHeads !== undefined &&
      Object.values(document.humeralHeads).some((radius) => radius <= 0)) ||
    [document.id, document.name, document.basis].some(
      (id) => id.trim() === "",
    ) ||
    new Set(bones).size !== bones.length ||
    bones.some((bone) => bone === "leftUpperArm" || bone === "rightUpperArm") ||
    new Set(shoulderBones).size !== shoulderBones.length ||
    new Set(goalBones).size !== goalBones.length ||
    goalBones.some((bone) => bones.includes(bone)) ||
    (document.shoulders ?? []).some(
      (one) => one.plane < -180 || one.plane >= 180,
    )
  )
    throw new Error(
      "Body edits need finite numbers, positive anatomical radii, nonempty identities, unique bones, distinct pose and thigh-goal authorities, shoulder goals in thorax-tt coordinates and canonical planes.",
    );
  return document;
}
