import {
  QuadrupedBody,
  QuadrupedSkeleton,
  createHorse,
} from "@automovie/archetypes";
import {
  Quaternion,
  Vector3,
  prepareArticulatedRig,
  validateModel,
} from "@automovie/engine";
import type {
  IAutoMovieArticulatedRig,
  IAutoMovieJointPose,
  IAutoMovieModelPart,
  IAutoMovieTransform,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";

/**
 * The real horse's named skeleton poses real geometry and carried contacts.
 *
 * Scenarios:
 * 1. Every generic neutral frame matches the actual horse bar's upper joint
 *    and orientation, with21 quadruped names and no dummy humanoid slot.
 * 2. A neck turn carries explicitly bound bridle parts and rein/lead frames;
 *    their neck-local coordinates stay fixed and their world positions move.
 * 3. Missing accessory or contact bindings refuse. Construction and sampling
 *    leave the original horse's complete serialization unchanged.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States actual source bars, independent neutral-frame comparison, carried-contact invariants and preservation of original horse bytes.
 * @evidence contracts/development/testing.md#behavioral-verification Uses the public horse producer, generic engine reader and actual QuadrupedSkeleton.pose model output, including validation and affordance frames rather than an isolated private matrix.
 * @evidence contracts/development/testing.md#independent-expectations Original built part transforms are the neutral oracle. A rigid carrier preserves inverse-neck coordinates of every explicitly attached contact, while a nonzero neck turn must move at least one rein in world space. Expected bone count21 is the declared5 axial links plus4x4 limb links.
 * @evidence contracts/development/testing.md#distinguishing-cases Contrasts neutral and articulated geometry, bone and accessory parts, root-carried and neck-carried contacts, complete versus missing bindings and current posed output versus untouched original serialization.
 * @evidence contracts/development/testing.md#execution-ownership One portable synchronous unit owns its producer, maps and posed outputs; no process, renderer, compiler or foreign runtime replacement is used.
 */
export function test_archetype_animal_skeleton(): void {
  const animal: ReturnType<typeof createHorse> = createHorse(
    { tack: "both" },
    12,
  );
  const original: string = JSON.stringify(animal);
  const skeleton: IAutoMovieArticulatedRig<QuadrupedBody.Bone> =
    QuadrupedSkeleton.of(animal);
  const reader: ReturnType<typeof prepareArticulatedRig<QuadrupedBody.Bone>> =
    prepareArticulatedRig(skeleton);
  const rest: ReadonlyMap<QuadrupedBody.Bone, IAutoMovieTransform> =
    reader.read();
  const findings: string[] = [];
  if (rest.size !== 21 || skeleton.bones[0]!.bone !== "trunk")
    findings.push("the actual quadruped vocabulary was not preserved");
  for (const [bone, frame] of rest) {
    const actual: IAutoMovieModelPart = animal.parts.find(
      (part: IAutoMovieModelPart): boolean => part.id === bone,
    )!;
    if (!same(frame, { ...actual.transform!, translation: end(actual, -1) }))
      findings.push(`neutral ${bone} no longer matches its actual upper joint`);
  }
  const parts: Record<string, QuadrupedBody.Bone> = {};
  for (const part of animal.parts)
    if (!rest.has(part.id as QuadrupedBody.Bone))
      parts[part.id] = [
        "crown-left",
        "crown-right",
        "cheek-left",
        "cheek-right",
        "blinker-left",
        "blinker-right",
        "bit",
        "bit-left",
        "bit-right",
        "rein-left",
        "rein-right",
        "lead",
      ].includes(part.id)
        ? "head"
        : "trunk";
  const contacts: Record<string, QuadrupedBody.Bone> = {};
  for (const contact of animal.affordances)
    contacts[contact.id] = contact.kind === "rein" ? "head" : "trunk";
  const joints: Map<
    QuadrupedBody.Bone,
    Pick<IAutoMovieJointPose, "flexion" | "abduction" | "twist">
  > = new Map([["neck", { flexion: 20, abduction: 0, twist: 0 }]]);
  const posed: ReturnType<typeof createHorse> = QuadrupedSkeleton.pose(
    animal,
    joints,
    parts,
    contacts,
  );
  const errors: ReturnType<typeof validateModel> = validateModel({
    model: posed,
  });
  if (!errors.success)
    findings.push("the actual posed model failed ordinary model admission");
  const oldNeck: IAutoMovieTransform = animal.parts.find(
    (part: IAutoMovieModelPart): boolean => part.id === "neck",
  )!.transform!;
  const newNeck: IAutoMovieTransform = posed.parts.find(
    (part: IAutoMovieModelPart): boolean => part.id === "neck",
  )!.transform!;
  let moved: boolean = false;
  for (const contact of animal.affordances) {
    if (contacts[contact.id] !== "head") continue;
    const current: IAutoMovieTransform = posed.affordance(
      contact.id as createHorse.Affordance,
    ).frame;
    const oldLocal: IAutoMovieTransform["translation"] =
      Quaternion.rotateVector(
        Quaternion.inverse(oldNeck.rotation),
        Vector3.subtract(contact.frame.translation, oldNeck.translation),
      );
    const newLocal: IAutoMovieTransform["translation"] =
      Quaternion.rotateVector(
        Quaternion.inverse(newNeck.rotation),
        Vector3.subtract(current.translation, newNeck.translation),
      );
    for (const axis of ["x", "y", "z"] as const)
      if (!nclose(oldLocal[axis], newLocal[axis], 1e-9))
        findings.push(`${contact.id} left its declared neck carrier`);
    moved ||= distance(current.translation, contact.frame.translation) > 0.001;
  }
  if (!moved)
    findings.push("the neck turn left every actual rein/lead frame at rest");
  const oldLink: IAutoMovieModelPart = animal.parts.find(
    (part: IAutoMovieModelPart): boolean => part.id === "neck",
  )!;
  const newLink: IAutoMovieModelPart = posed.parts.find(
    (part: IAutoMovieModelPart): boolean => part.id === "neck",
  )!;
  const head: IAutoMovieModelPart = posed.parts.find(
    (part: IAutoMovieModelPart): boolean => part.id === "head",
  )!;
  if (
    distance(end(oldLink, -1), end(newLink, -1)) > 1e-9 ||
    distance(end(newLink, 1), end(head, -1)) > 1e-9
  )
    findings.push(
      "the neck rotated around its mesh centre or separated its head joint",
    );
  for (const run of [
    (): unknown => QuadrupedSkeleton.pose(animal, joints, {}, contacts),
    (): unknown => QuadrupedSkeleton.pose(animal, joints, parts, {}),
  ]) {
    try {
      run();
      findings.push("an incomplete attachment map was silently accepted");
    } catch {}
  }
  if (JSON.stringify(animal) !== original)
    findings.push("posing changed the original horse serialization");
  TestValidator.equals("real non-humanoid skeleton consumer", findings, []);
}

/** Euclidean separation is computed directly from coordinates as an independent geometric observation. */
function distance(
  left: IAutoMovieTransform["translation"],
  right: IAutoMovieTransform["translation"],
): number {
  return Math.hypot(left.x - right.x, left.y - right.y, left.z - right.z);
}

/** A real bar's endpoint is its centre plus a signed rotated half-length. */
function end(
  part: IAutoMovieModelPart,
  side: 1 | -1,
): IAutoMovieTransform["translation"] {
  if (
    part.geometry.type !== "primitive" ||
    (part.geometry.shape.type !== "cylinder" &&
      part.geometry.shape.type !== "capsule")
  )
    throw new Error("The fixture's named link must be an actual bar");
  return Vector3.add(
    part.transform!.translation,
    Quaternion.rotateVector(part.transform!.rotation, {
      x: 0,
      y: (side * part.geometry.shape.height) / 2,
      z: 0,
    }),
  );
}

/** Position equality and sign-independent quaternion agreement compare the existing actual bars. */
function same(left: IAutoMovieTransform, right: IAutoMovieTransform): boolean {
  return (
    (["x", "y", "z"] as const).every((axis: "x" | "y" | "z"): boolean =>
      nclose(left.translation[axis], right.translation[axis], 1e-9),
    ) &&
    nclose(
      Math.abs(
        left.rotation.x * right.rotation.x +
          left.rotation.y * right.rotation.y +
          left.rotation.z * right.rotation.z +
          left.rotation.w * right.rotation.w,
      ),
      1,
      1e-9,
    )
  );
}
