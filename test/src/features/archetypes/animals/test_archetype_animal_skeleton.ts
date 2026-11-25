import {
  AutoMovieArchetypeEquine,
  AutoMovieArchetypeQuadrupedBody,
  AutoMovieArchetypeQuadrupedSkeleton,
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

import { nclose } from "../../internal/nclose";

/**
 * The real horse's named skeleton poses real geometry and carried contacts.
 *
 * Scenarios:
 *
 * 1. Every generic neutral frame matches the actual horse bar's upper joint and
 *    orientation, with 23 quadruped names and no dummy humanoid slot.
 * 2. A neck turn carries explicitly bound bridle parts and rein/lead frames; their
 *    neck-local coordinates stay fixed and their world positions move.
 * 3. Independently binding the same held origins to the trunk keeps the hands
 *    fixed while actual flexible spans retain head-local bit points, full
 *    occupied runs and line-aligned grip frames. Both binding choices work.
 * 4. Missing accessory/contact bindings and unknown replacement frame ids refuse.
 *    Construction and sampling leave the original horse's complete
 *    serialization unchanged.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States actual source bars, independent neutral-frame comparison, carried-contact invariants and preservation of original horse bytes.
 * @evidence contracts/development/testing.md#behavioral-verification Uses the public horse producer, generic engine reader and actual AutoMovieArchetypeQuadrupedSkeleton.pose output. Both rigid head-carried and independently trunk-held contact cases observe real parts and full flexible held runs instead of an isolated matrix.
 * @evidence contracts/development/testing.md#independent-expectations Original built geometry is the neutral oracle. Head-bound contacts preserve inverse-neck coordinates; trunk-held origins preserve inverse-trunk coordinates while span distal points preserve inverse-head coordinates and contact +X follows actual rod +Y. Expected bone count 23 is five axial links, two shoulder blades and four times four limb links.
 * @evidence contracts/development/testing.md#distinguishing-cases Contrasts neutral and articulated geometry, bone and accessory parts, root-carried and neck-carried contacts, complete versus missing bindings and current posed output versus untouched original serialization.
 * @evidence contracts/development/testing.md#execution-ownership One portable synchronous unit owns its producer, maps and posed outputs; no process, renderer, compiler or foreign runtime replacement is used.
 */
export function test_archetype_animal_skeleton(): void {
  const animal: ReturnType<typeof createHorse> = createHorse(
    { tack: "both" },
    12,
  );
  const original: string = JSON.stringify(animal);
  const skeleton: IAutoMovieArticulatedRig<AutoMovieArchetypeQuadrupedBody.Bone> =
    AutoMovieArchetypeQuadrupedSkeleton.of(animal);
  const reader: ReturnType<
    typeof prepareArticulatedRig<AutoMovieArchetypeQuadrupedBody.Bone>
  > = prepareArticulatedRig(skeleton);
  const rest: ReadonlyMap<
    AutoMovieArchetypeQuadrupedBody.Bone,
    IAutoMovieTransform
  > = reader.read();
  const findings: string[] = [];
  if (rest.size !== 23 || skeleton.bones[0]!.bone !== "trunk")
    findings.push("the actual quadruped vocabulary was not preserved");
  for (const [bone, frame] of rest) {
    const actual: IAutoMovieModelPart = animal.parts.find(
      (part: IAutoMovieModelPart): boolean => part.id === bone,
    )!;
    if (!same(frame, { ...actual.transform!, translation: end(actual, -1) }))
      findings.push(`neutral ${bone} no longer matches its actual upper joint`);
  }
  const parts: Record<string, AutoMovieArchetypeQuadrupedBody.Bone> = {};
  for (const part of animal.parts)
    if (!rest.has(part.id as AutoMovieArchetypeQuadrupedBody.Bone))
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
  const contacts: Record<string, AutoMovieArchetypeQuadrupedBody.Bone> = {};
  for (const contact of animal.affordances)
    contacts[contact.id] = contact.kind === "rein" ? "head" : "trunk";
  const joints: Map<
    AutoMovieArchetypeQuadrupedBody.Bone,
    Pick<IAutoMovieJointPose, "flexion" | "abduction" | "twist">
  > = new Map([["neck", { flexion: 20, abduction: 0, twist: 0 }]]);
  const posed: ReturnType<typeof createHorse> =
    AutoMovieArchetypeQuadrupedSkeleton.pose(animal, joints, parts, contacts);
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
      contact.id as AutoMovieArchetypeEquine.Affordance,
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

  // A held hand can instead stay with the body while the bit moves separately.
  // This complements the explicit head-following case rather than weakening it.
  const trunkContacts: Record<string, AutoMovieArchetypeQuadrupedBody.Bone> =
    {};
  for (const contact of animal.affordances) trunkContacts[contact.id] = "trunk";
  const heldPose: ReturnType<typeof createHorse> =
    AutoMovieArchetypeQuadrupedSkeleton.pose(
      animal,
      joints,
      parts,
      trunkContacts,
    );
  const oldBody: IAutoMovieTransform = animal.parts.find(
    (part: IAutoMovieModelPart): boolean => part.id === "trunk",
  )!.transform!;
  const heldBody: IAutoMovieTransform = heldPose.parts.find(
    (part: IAutoMovieModelPart): boolean => part.id === "trunk",
  )!.transform!;
  const oldHead: IAutoMovieTransform = animal.parts.find(
    (part: IAutoMovieModelPart): boolean => part.id === "head",
  )!.transform!;
  const heldHead: IAutoMovieTransform = heldPose.parts.find(
    (part: IAutoMovieModelPart): boolean => part.id === "head",
  )!.transform!;
  const lines: readonly (readonly [
    AutoMovieArchetypeEquine.Affordance,
    string,
  ])[] = [
    ["leftRein", "rein-left"],
    ["rightRein", "rein-right"],
    ["lead", "lead"],
  ];
  let bitMoved: boolean = false;
  for (const [id, partId] of lines) {
    const previous: ReturnType<typeof animal.affordance> =
      animal.affordance(id);
    const current: ReturnType<typeof animal.affordance> =
      heldPose.affordance(id);
    const beforeLine: IAutoMovieModelPart = animal.parts.find(
      (part: IAutoMovieModelPart): boolean => part.id === partId,
    )!;
    const afterLine: IAutoMovieModelPart = heldPose.parts.find(
      (part: IAutoMovieModelPart): boolean => part.id === partId,
    )!;
    const heldLength: number = current.length ?? NaN;
    if (
      current.kind !== "rein" ||
      !(heldLength > 0) ||
      afterLine.geometry.type !== "primitive" ||
      afterLine.geometry.shape.type !== "cylinder"
    ) {
      findings.push(`${id} lost its actual flexible rein geometry`);
      continue;
    }
    const lineAxis: IAutoMovieTransform["translation"] =
      Quaternion.rotateVector(afterLine.transform!.rotation, {
        x: 0,
        y: 1,
        z: 0,
      });
    const heldCentre: IAutoMovieTransform["translation"] = Vector3.add(
      end(afterLine, -1),
      Vector3.scale(lineAxis, heldLength / 2),
    );
    if (
      distance(
        local(oldBody, previous.frame.translation),
        local(heldBody, current.frame.translation),
      ) > 1e-9 ||
      distance(
        local(oldHead, end(beforeLine, 1)),
        local(heldHead, end(afterLine, 1)),
      ) > 1e-9 ||
      distance(heldCentre, current.frame.translation) > 1e-9 ||
      !nclose(
        Math.abs(
          Vector3.dot(
            lineAxis,
            Quaternion.rotateVector(current.frame.rotation, {
              x: 1,
              y: 0,
              z: 0,
            }),
          ),
        ),
        1,
        1e-9,
      ) ||
      afterLine.geometry.shape.height < heldLength - 1e-9
    )
      findings.push(`${id} detached its trunk-held run or actual head anchor`);
    bitMoved ||= distance(end(beforeLine, 1), end(afterLine, 1)) > 0.001;
  }
  if (!bitMoved) findings.push("trunk-held spans hid the actual moving bit");
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
    (): unknown =>
      AutoMovieArchetypeQuadrupedSkeleton.pose(animal, joints, {}, contacts),
    (): unknown =>
      AutoMovieArchetypeQuadrupedSkeleton.pose(animal, joints, parts, {}),
    (): unknown => animal.reposed(animal.parts, new Map()),
    (): unknown =>
      animal.reposed(
        animal.parts,
        new Map([["unknown-contact", animal.affordances[0]!.frame]]),
      ),
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

/** Read a physical point in the actual primitive-centre carrier frame. */
function local(
  frame: IAutoMovieTransform,
  point: IAutoMovieTransform["translation"],
): IAutoMovieTransform["translation"] {
  return Quaternion.rotateVector(
    Quaternion.inverse(frame.rotation),
    Vector3.subtract(point, frame.translation),
  );
}

/**
 * Euclidean separation is computed directly from coordinates as an independent
 * geometric observation.
 */
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

/**
 * Position equality and sign-independent quaternion agreement compare the
 * existing actual bars.
 */
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
