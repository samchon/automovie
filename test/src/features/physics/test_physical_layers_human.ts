import type {
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { Quaternion } from "../../../../packages/engine/src/math/Quaternion";
import { Vector3 } from "../../../../packages/engine/src/math/Vector3";
import { AutoMovieHumanPhysicalProfile as Provider } from "../../../../packages/human/src/skeleton/AutoMovieHumanPhysicalProfile";
import { AutoMovieHumanRigControls as Controls } from "../../../../packages/human/src/skeleton/AutoMovieHumanRigControls";
import { HumanPeople } from "../internal/HumanPeople";
import { PhysicalHumanFixtures } from "../internal/PhysicalHumanFixtures";

/** Actual male/female bodies retain published limb measurements, source girths/ROM and additive equipment. */
export function test_physical_layers_human(): void {
  const male: ReturnType<typeof PhysicalHumanFixtures.get> =
    PhysicalHumanFixtures.get("m1");
  const female: ReturnType<typeof PhysicalHumanFixtures.get> =
    PhysicalHumanFixtures.get("f1");
  const findings: string[] = [];
  const reused: ReturnType<typeof Provider.prepare> = Provider.prepare(
    HumanPeople.params("m1"),
    {
      mass: 80,
      frequency: 20,
      dampingRatio: 1,
      torquePerKg: 50,
      passiveRate: 5,
      equipment: [],
      materials: male.profile.materials,
      skin: "skin",
    },
    male.evaluate,
  );
  if (
    reused.evaluate !== male.evaluate ||
    JSON.stringify(reused.profile) !== JSON.stringify(male.profile)
  )
    findings.push(
      "borrowed exact-body evaluator changed the physical description",
    );
  // Independent published Table 5/6 numbers, rather than importing the table
  // under test. Internal head/trunk/foot allocation is explicitly geometric.
  for (const [person, fractions, normalization] of [
    [male, [0.0271, 0.0162, 0.0061, 0.1416, 0.0433], 1],
    [female, [0.0255, 0.0138, 0.0056, 0.1478, 0.0481], 0.9999],
  ] as const) {
    const profile: P = person.profile;
    if (
      Math.abs(profile.mass - 80) > 1e-10 ||
      profile.segments.some(
        (segment: (typeof profile.segments)[number]): boolean =>
          segment.mass <= 0 ||
          ![segment.inertia.x, segment.inertia.y, segment.inertia.z].every(
            (value: number): boolean => Number.isFinite(value) && value > 0,
          ),
      )
    )
      findings.push("nonpositive or unconserved body mass/inertia");
    const output: ReturnType<typeof person.evaluate> = person.evaluate({});
    for (const side of ["left", "right"])
      for (const [index, region] of [
        "UpperArm",
        "LowerArm",
        "Hand",
        "UpperLeg",
        "LowerLeg",
      ].entries()) {
        const segment: P.ISegment = profile.segments.find(
          (candidate: (typeof profile.segments)[number]): boolean =>
            candidate.bone === `${side}${region}`,
        )!;
        if (
          Math.abs(segment.mass - (80 * fractions[index]!) / normalization) >
          1e-10
        )
          findings.push(`${region}: published mass fraction`);
        const radius: number = output.bones.find(
          (bone: (typeof output.bones)[number]): boolean =>
            bone.bone === segment.bone,
        )!.radius;
        const shape: P.IShape = segment.shapes[0]!;
        if (shape.kind !== "capsule" || shape.radius !== radius)
          findings.push(`${region}: actual source girth`);
      }
    for (const joint of profile.joints)
      for (const axis of joint.axes) {
        const bounds: ReturnType<typeof Controls.bounds> = Controls.bounds(
          Controls.channel(axis.channel!),
        );
        if (
          !axis.sourceDomain ||
          Math.abs(
            axis.sourceDomain.minimum - (bounds.minimum * Math.PI) / 180,
          ) > 1e-12 ||
          Math.abs(
            axis.sourceDomain.maximum - (bounds.maximum * Math.PI) / 180,
          ) > 1e-12
        )
          findings.push(`${joint.id}: canonical ROM provenance`);
      }
    const arm: P.ISegment = profile.segments.find(
      (segment: (typeof profile.segments)[number]): boolean =>
        segment.bone === "leftUpperArm",
    )!;
    const elbow: P.ISegment = profile.segments.find(
      (segment: (typeof profile.segments)[number]): boolean =>
        segment.bone === "leftLowerArm",
    )!;
    const length: number = Vector3.length(
      Vector3.subtract(elbow.neutral.position, arm.neutral.position),
    );
    const expectedCenter: IAutoMovieVector3 = Vector3.scale(
      Quaternion.rotateVector(
        Quaternion.inverse(arm.neutral.rotation),
        Vector3.subtract(elbow.neutral.position, arm.neutral.position),
      ),
      person === male ? 0.5772 : 0.5754,
    );
    const radii: readonly number[] =
      person === male ? [0.285, 0.269, 0.158] : [0.278, 0.26, 0.148];
    const expectedTrace: number =
      arm.mass *
      length ** 2 *
      radii.reduce(
        (sum: number, radius: number): number => sum + radius ** 2,
        0,
      );
    if (
      Vector3.length(Vector3.subtract(arm.centerOfMass, expectedCenter)) >
        1e-10 ||
      Math.abs(arm.inertia.x + arm.inertia.y + arm.inertia.z - expectedTrace) >
        1e-10
    )
      findings.push("published upper-arm centre and inertia trace");
  }
  const bare: P = male.profile;
  const hand: P.ISegment = bare.segments.find(
    (segment: (typeof bare.segments)[number]): boolean =>
      segment.bone === "leftHand",
  )!;
  const offset: IAutoMovieVector3 = { x: 0.065, y: 0, z: 0 };
  const equipped: P = Provider.create(HumanPeople.params("m1"), {
    mass: 80,
    frequency: 20,
    dampingRatio: 1,
    torquePerKg: 50,
    passiveRate: 5,
    skin: "skin",
    materials: [
      ...bare.materials,
      { id: "glove", friction: 0.6, restitution: 0, compliance: 0, damping: 0 },
    ],
    equipment: [
      {
        bone: "leftHand",
        mass: 0.5,
        centerOfMass: offset,
        inertia: { x: 0.0003, y: 0.0004, z: 0.0005 },
        shape: {
          id: "glove",
          kind: "sphere",
          radius: 0.07,
          material: "glove",
          transform: { position: offset, rotation: { x: 0, y: 0, z: 0, w: 1 } },
        },
      },
    ],
  });
  const worldEquipment: IAutoMovieVector3 = Vector3.add(
    hand.neutral.position,
    Quaternion.rotateVector(hand.neutral.rotation, offset),
  );
  const expected: IAutoMovieVector3 = Vector3.scale(
    Vector3.add(
      Vector3.scale(bare.centerOfMass, 80),
      Vector3.scale(worldEquipment, 0.5),
    ),
    1 / 80.5,
  );
  const changed: P.ISegment = equipped.segments.find(
    (segment: (typeof equipped.segments)[number]): boolean =>
      segment.bone === "leftHand",
  )!;
  if (
    Math.abs(equipped.mass - 80.5) > 1e-10 ||
    Vector3.length(Vector3.subtract(equipped.centerOfMass, expected)) > 1e-10 ||
    Math.abs(changed.mass - hand.mass - 0.5) > 1e-10 ||
    !changed.shapes.some(
      (shape: (typeof changed.shapes)[number]): boolean => shape.id === "glove",
    )
  )
    findings.push("additive equipment mass, centre and actual collider");
  if (
    male.profile.segments[0]!.neutral.position.y ===
    female.profile.segments[0]!.neutral.position.y
  )
    findings.push("distinct actual person dimensions were lost");
  TestValidator.equals("all Human provider measurements", findings, []);
}
