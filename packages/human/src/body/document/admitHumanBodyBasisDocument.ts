import typia from "typia";

import { admitHumanBodyDocumentAnatomy } from "../anatomy/admitHumanBodyDocumentAnatomy";
import { admitHumanBodyAnatomicalMeasurements } from "../anatomy/measurements/admitHumanBodyAnatomicalMeasurements";
import type { IAutoMovieHumanBodyBasisDocument } from "../structures/IAutoMovieHumanBodyBasisDocument";
import type { IAutoMovieHumanBodyAnatomicalAssembly } from "../anatomy/assembly/IAutoMovieHumanBodyAnatomicalAssembly";

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
 * Anatomical measurements pass the shared physical-scalar admission and then
 * `admitHumanBodyDocumentAnatomy`, which refuses any value without a consumer.
 * An optional exact-basis source assembly supplies actual registered internal
 * quantity paths, protocols, members and target fields; observations on those
 * paths remain raw acquisition records without inferred shape. Without that
 * source context the earlier unsupported/observed refusals remain unchanged.
 */
export function admitHumanBodyBasisDocument(
  input: unknown,
  source?: IAutoMovieHumanBodyAnatomicalAssembly,
): IAutoMovieHumanBodyBasisDocument {
  const document = typia.assertEquals<IAutoMovieHumanBodyBasisDocument>(input);
  if (source !== undefined && source.basis !== document.basis)
    throw new Error("Body source quantity admission needs the document's exact registered basis.");
  if (source?.mode === "neutral-only" &&
    ([document.pose, document.shoulders, document.toes, document.anatomicalMotion, document.thighGoals]
      .some((rows) => (rows?.length ?? 0) !== 0) || document.groundPlacement !== undefined))
    throw new Error("The body source is neutral-only; performance requests and ground placement are not registered.");
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
  for (const goal of document.anatomicalMotion ?? [])
    values.push(goal.value);
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
  const anatomicalCoordinates = (document.anatomicalMotion ?? []).map((one) => one.bone + "." + one.axis);
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
    new Set(anatomicalCoordinates).size !== anatomicalCoordinates.length ||
    goalBones.some((bone) => bones.includes(bone)) ||
    (document.shoulders ?? []).some(
      (one) => one.plane < -180 || one.plane >= 180,
    )
  )
    throw new Error(
      "Body edits need finite numbers, positive anatomical radii, nonempty identities, unique bones and anatomical coordinates, distinct pose and thigh-goal authorities, shoulder goals in thorax-tt coordinates and canonical planes.",
    );
  if (document.anatomy !== undefined) {
    admitHumanBodyAnatomicalMeasurements(document.anatomy);
    admitHumanBodyDocumentAnatomy(document.anatomy, document.shape, source);
  }
  return document;
}
