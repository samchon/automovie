import typia from "typia";

import { admitHumanBodyDocumentAnatomy } from "../anatomy/admitHumanBodyDocumentAnatomy";
import type { IAutoMovieHumanBodyAnatomicalAssembly } from "../anatomy/assembly/IAutoMovieHumanBodyAnatomicalAssembly";
import { admitHumanBodyAnatomicalMeasurements } from "../anatomy/measurements/admitHumanBodyAnatomicalMeasurements";
import type { IAutoMovieHumanBodyBasisDocument } from "../structures/IAutoMovieHumanBodyBasisDocument";

/**
 * Admit the body document's exact schema and finite scalars for loading and saving.
 *
 * Named shape weights, generic pose, toe flexion/abduction and TT goals, colour/detail/material scalars must be finite; supplied humeral-head radii in millimetres must be positive. Identities are nonempty, shoulder planes lie in [-180,180), and generic pose, shoulder, thigh-goal and anatomical coordinate rows have unique authorities. Generic upper-arm Euler requests refuse rather than replacing TT shoulder coordinates. Basis channel/joint existence and clinical ranges remain the compiled builder's decision, allowing a document to be saved before its basis is loaded.
 *
 * Anatomical measurements pass their shared scalar and registered-consumer admission. Optional source context must name the exact document basis; a neutral-only source refuses performance rows and ground placement. Actual registered quantity observations remain acquisition records rather than inferred personal tissue shape. The returned document is the admitted input object, not an owned clone, and validation does not mutate it or perform geometry.
 *
 * @evidence contracts/common.md#principled-implementation Exact schema precedes finite scalar, unique coordinate authority and canonical TT-plane checks; anatomical requests share their measurement/source consumer admission and neutral-only context refuses performance.
 * @evidence contracts/common.md#clear-and-simple-design One document boundary serves loading, saving and preparation while the compiled basis retains channel existence, clinical reach and geometry decisions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unknown/legacy fields and generic upper-arm Euler authority refuse instead of being dropped; raw source observations cannot imply personal shape or clinical validity.
 * @evidence contracts/common.md#meaningful-documentation The prose gives degree/millimetre/scalar conventions, exact-basis context, neutral-only limits, borrowed return identity and deferred range/geometry admission.
 * @evidence contracts/performance.md#efficient-algorithms Scalar extraction and duplicate sets scale with actual document rows/fields; thigh-goal conflict checks can scan generic pose rows and anatomical admission adds its registered-source costs.
 * @evidence contracts/performance.md#reuse-equivalent-work Parse, serialize and preparation reuse this boundary and existing anatomical admission owners without maintaining a second accepted document schema.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Scalar arrays, identity lists and duplicate sets expire after synchronous validation; the input record escapes unchanged with no cached source, external handle or task.
 */
export function admitHumanBodyBasisDocument(
  input: unknown,
  source?: IAutoMovieHumanBodyAnatomicalAssembly,
): IAutoMovieHumanBodyBasisDocument {
  const document: IAutoMovieHumanBodyBasisDocument = typia.assertEquals<IAutoMovieHumanBodyBasisDocument>(input);
  if (source !== undefined && source.basis !== document.basis)
    throw new Error(
      "Body source quantity admission needs the document's exact registered basis.",
    );
  if (
    source?.mode === "neutral-only" &&
    ([
      document.pose,
      document.shoulders,
      document.toes,
      document.anatomicalMotion,
      document.thighGoals,
    ].some((rows: readonly unknown[] | undefined): boolean => (rows?.length ?? 0) !== 0) ||
      document.groundPlacement !== undefined)
  )
    throw new Error(
      "The body source is neutral-only; performance requests and ground placement are not registered.",
    );
  const values: number[] = [...Object.values(document.shape)];
  if (document.humeralHeads !== undefined)
    values.push(...Object.values(document.humeralHeads));
  for (const joint of document.pose ?? [])
    for (const angle of [joint.flexion, joint.abduction, joint.twist])
      if (angle !== null) values.push(angle);
  for (const shoulder of document.shoulders ?? [])
    values.push(shoulder.plane, shoulder.elevation, shoulder.axialRotation);
  for (const toe of document.toes ?? []) {
    values.push(toe.flexion);
    if (toe.abduction !== undefined) values.push(toe.abduction);
  }
  for (const goal of document.thighGoals ?? [])
    values.push(goal.flexion, goal.abduction, goal.twist);
  for (const goal of document.anatomicalMotion ?? []) values.push(goal.value);
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
  const bones: NonNullable<IAutoMovieHumanBodyBasisDocument["pose"]>[number]["bone"][] = (document.pose ?? []).map((joint: NonNullable<IAutoMovieHumanBodyBasisDocument["pose"]>[number]): typeof joint.bone => joint.bone);
  const shoulderBones: NonNullable<IAutoMovieHumanBodyBasisDocument["shoulders"]>[number]["bone"][] = (document.shoulders ?? []).map((one: NonNullable<IAutoMovieHumanBodyBasisDocument["shoulders"]>[number]): typeof one.bone => one.bone);
  const goalBones: NonNullable<IAutoMovieHumanBodyBasisDocument["thighGoals"]>[number]["bone"][] = (document.thighGoals ?? []).map((one: NonNullable<IAutoMovieHumanBodyBasisDocument["thighGoals"]>[number]): typeof one.bone => one.bone);
  const anatomicalCoordinates: string[] = (document.anatomicalMotion ?? []).map(
    (one: NonNullable<IAutoMovieHumanBodyBasisDocument["anatomicalMotion"]>[number]): string => one.bone + "." + one.axis,
  );
  if (
    !values.every(Number.isFinite) ||
    (document.humeralHeads !== undefined &&
      Object.values(document.humeralHeads).some((radius: number): boolean => radius <= 0)) ||
    [document.id, document.name, document.basis].some(
      (id: string): boolean => id.trim() === "",
    ) ||
    new Set(bones).size !== bones.length ||
    bones.some((bone: typeof bones[number]): boolean => bone === "leftUpperArm" || bone === "rightUpperArm") ||
    new Set(shoulderBones).size !== shoulderBones.length ||
    new Set(goalBones).size !== goalBones.length ||
    new Set(anatomicalCoordinates).size !== anatomicalCoordinates.length ||
    goalBones.some((bone: typeof goalBones[number]): boolean => bones.includes(bone)) ||
    (document.shoulders ?? []).some(
      (one: NonNullable<IAutoMovieHumanBodyBasisDocument["shoulders"]>[number]): boolean => one.plane < -180 || one.plane >= 180,
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
