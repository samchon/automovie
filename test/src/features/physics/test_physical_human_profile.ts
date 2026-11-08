import type {
  IAutoMovieFootfallPattern,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { Quaternion } from "../../../../packages/engine/src/math/Quaternion";
import { Vector3 } from "../../../../packages/engine/src/math/Vector3";
import { AutoMovieHumanPhysicalBracing } from "../../../../packages/human/src/skeleton/AutoMovieHumanPhysicalBracing";
import type { AutoMovieHumanPhysicalProfile } from "../../../../packages/human/src/skeleton/AutoMovieHumanPhysicalProfile";
import { AutoMovieHumanPhysicalSupports } from "../../../../packages/human/src/skeleton/AutoMovieHumanPhysicalSupports";
import type { AutoMovieHumanSkeleton } from "../../../../packages/human/src/skeleton/AutoMovieHumanSkeleton";
import type { IAutoMovieHumanPhysicalSource as Source } from "../../../../packages/human/src/skeleton/IAutoMovieHumanPhysicalSource";
import { mapAutoMovieHumanPhysicalProfile } from "../../../../packages/human/src/skeleton/mapAutoMovieHumanPhysicalProfile";

/** The Human physical mapping turns an explicit polygon-person source into a coherent articulated profile and its own support description.
 *
 * Scenarios:
 * 1. Segment masses add up to the declared body mass plus declared equipment, and the head region keeps its published share.
 * 2. Every joint's parent and child anchors coincide at the neutral pose, although every bone frame is rotated.
 * 3. Each native joint axis, signed by its coordinate sign, is the source coordinate's direction, with limits mirrored for a negative sign.
 * 4. A capsule spans its joint to its declared end; a foot box keeps its declared world sole.
 * 5. Both feet expose a complete forefoot contact face on the sole; a raised heel keeps only witnesses of that face.
 * 6. The standing recovery envelope stays between the floor and the neutral centre of mass.
 * 7. Non-orthogonal coordinates and a non-positive body mass are refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs `interface`, `Quaternion`, `Vector3`, `AutoMovieHumanPhysicalBracing` on in-memory inputs and asserts the returned observations through 2x TestValidator.equals; 7 numbered scenarios (first: Segment masses add up to the declared body mass plus declared equipment, and the head region keeps its...; last: Non-orthogonal coordinates and a non-positive body mass are refused.). A wrong result for any of those inputs fails an assertion, while results the scenarios allow do not.
 * @evidence contracts/development/testing.md#independent-expectations Expected values come from the literals and relations written in the test itself and from the scenario sentences above, not from a snapshot of the implementation's output; where an expectation is computed by another production function the oracle is not independent, and this answer does not establish a reference beyond the scenario text.
 * @evidence contracts/development/testing.md#distinguishing-cases Contributes 7 numbered scenarios (first: Segment masses add up to the declared body mass plus declared equipment, and the head region keeps its...; last: Non-orthogonal coordinates and a non-positive body mass are refused.), including the negative, boundary or refusal cases those sentences name; cases the sentences do not name are not claimed here and are owned by other tests or are uncovered.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through the discoverable function `test_physical_human_profile`, which owns every case it runs; it registers no dynamic cases and starts no process, browser, viewer, render or GPU host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 7 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: Segment masses add up to the declared body mass plus declared equipment, and the head region keeps its published share.).
 */
export function test_physical_human_profile(): void {
  const source: Source = polygonPerson();
  const profile: P = mapAutoMovieHumanPhysicalProfile(source, options());
  const failures: string[] = [];
  const bone: (name: string) => P.ISegment = (name: string): P.ISegment =>
    profile.segments.find(
      (segment: P.ISegment): boolean => segment.bone === name,
    )!;
  const world: (
    segment: P.ISegment,
    local: IAutoMovieVector3,
  ) => IAutoMovieVector3 = (
    segment: P.ISegment,
    local: IAutoMovieVector3,
  ): IAutoMovieVector3 =>
    Vector3.add(
      segment.neutral.position,
      Quaternion.rotateVector(segment.neutral.rotation, local),
    );

  // Mass is distributed, never invented or lost; equipment adds its own.
  const total: number = profile.segments.reduce(
    (sum: number, segment: P.ISegment): number => sum + segment.mass,
    0,
  );
  if (!(Math.abs(total - 80.3) <= 1e-9 * 80))
    failures.push(`segment masses sum to ${total} kg`);
  const fractions: number =
    0.0694 + 0.4346 + 2 * (0.0271 + 0.0162 + 0.0061 + 0.1416 + 0.0433 + 0.0137);
  const head: number = bone("neck").mass + bone("head").mass;
  if (!(Math.abs(head - (80 * 0.0694) / fractions) <= 1e-9))
    failures.push(`head region ${head} kg`);
  if (bone("leftHand").shapes.length !== 2)
    failures.push("equipment collider is not retained");

  // Each joint connects the same world point from both sides.
  for (const joint of profile.joints) {
    const gap: number = Vector3.length(
      Vector3.subtract(
        world(bone(joint.parent), joint.parentFrame.position),
        world(bone(joint.child), joint.childFrame.position),
      ),
    );
    if (!(gap <= 1e-9)) failures.push(`${joint.id}: anchors ${gap} m apart`);

    // The native axis carries the source coordinate with its sign.
    const own: Source.ISegment = source.segments.find(
      (segment: Source.ISegment): boolean => segment.bone === joint.child,
    )!;
    if (joint.axes.length !== own.coordinates.length)
      failures.push(`${joint.id}: ${joint.axes.length} axes`);
    joint.axes.forEach((axis: P.IAxis, index: number): void => {
      const coordinate: Source.ICoordinate = own.coordinates[index]!;
      const unit: IAutoMovieVector3 = {
        x: axis.axis === "x" ? 1 : 0,
        y: axis.axis === "y" ? 1 : 0,
        z: axis.axis === "z" ? 1 : 0,
      };
      const sign: number = axis.coordinateSign ?? 1;
      const carried: IAutoMovieVector3 = Vector3.scale(
        Quaternion.rotateVector(joint.childFrame.rotation, unit),
        sign,
      );
      const radians: number = Math.PI / 180;
      const limits: [number, number] =
        sign === 1
          ? [coordinate.minimum * radians, coordinate.maximum * radians]
          : [-coordinate.maximum * radians, -coordinate.minimum * radians];
      if (
        axis.channel !== coordinate.channel ||
        Vector3.length(Vector3.subtract(carried, coordinate.direction)) >
          1e-12 ||
        Math.abs(axis.minimum - limits[0]) > 1e-12 ||
        Math.abs(axis.maximum - limits[1]) > 1e-12
      )
        failures.push(
          `${joint.id}: axis ${index} does not carry its coordinate`,
        );
    });
  }
  const mirrored: boolean = profile.joints.some((joint: P.IJoint): boolean =>
    joint.axes.some((axis: P.IAxis): boolean => axis.coordinateSign === -1),
  );
  if (!mirrored) failures.push("no coordinate opposite its basis axis");

  // Solids keep their declared world geometry.
  for (const own of source.segments) {
    const segment: P.ISegment = bone(own.bone);
    const shape: P.IShape = segment.shapes[0]!;
    const centre: IAutoMovieVector3 = world(segment, shape.transform.position);
    if (own.solid.kind === "capsule" && shape.kind === "capsule") {
      const length: number = Vector3.length(
        Vector3.subtract(own.solid.end, own.neutral.position),
      );
      const middle: IAutoMovieVector3 = Vector3.scale(
        Vector3.add(own.solid.end, own.neutral.position),
        0.5,
      );
      const axis: IAutoMovieVector3 = Quaternion.rotateVector(
        Quaternion.multiply(segment.neutral.rotation, shape.transform.rotation),
        { x: 0, y: 1, z: 0 },
      );
      const along: IAutoMovieVector3 = Vector3.normalize(
        Vector3.subtract(own.solid.end, own.neutral.position),
      );
      if (
        Vector3.length(Vector3.subtract(centre, middle)) > 1e-12 ||
        Math.abs(Math.abs(Vector3.dot(axis, along)) - 1) > 1e-12 ||
        Math.abs(
          shape.radius + shape.halfLength - Math.max(length / 2, shape.radius),
        ) > 1e-12
      )
        failures.push(`${own.bone}: capsule leaves its joint-to-end span`);
    } else if (own.solid.kind === "box" && shape.kind === "box") {
      if (Vector3.length(Vector3.subtract(centre, own.solid.center)) > 1e-12)
        failures.push(`${own.bone}: box leaves its declared centre`);
    } else failures.push(`${own.bone}: solid kind changed`);
  }

  // Supports come from the provider's own foot envelope, on the declared sole.
  const reference: Pick<AutoMovieHumanSkeleton.IOutput, "posed"> = {
    posed: placements(source),
  };
  const pattern: IAutoMovieFootfallPattern = AutoMovieHumanPhysicalSupports(
    profile,
    reference,
  );
  const raised: IAutoMovieFootfallPattern = AutoMovieHumanPhysicalSupports(
    profile,
    reference,
    ["left"],
  );
  if (pattern.limbs.length !== 2 || pattern.minimumSupports !== 1)
    failures.push("own support population");
  if (
    raised.limbs[0]!.floorPoints?.length !== 2 ||
    raised.limbs[1]!.floorPoints?.length !== 4 ||
    raised.limbs[0]!.floorPoints!.some(
      (
        witness: NonNullable<
          IAutoMovieFootfallPattern["limbs"][number]["floorPoints"]
        >[number],
      ): boolean =>
        !pattern.limbs[0]!.floorPoints!.some(
          (corner: typeof witness): boolean =>
            Vector3.length(
              Vector3.subtract(corner.localPoint, witness.localPoint),
            ) < 1e-12,
        ),
    )
  )
    failures.push("raised heel invents support outside the actual envelope");
  for (const limb of pattern.limbs) {
    if (
      limb.floorPoints?.length !== 4 ||
      limb.chain.at(-1) !== limb.bone ||
      !limb.contacts?.includes(limb.bone)
    )
      failures.push(`${limb.bone}: incomplete support binding`);
    const segment: P.ISegment = bone(limb.bone);
    const shape: P.IShape = segment.shapes[0]!;
    if (shape.kind !== "box") throw new Error("Expected the forefoot box");
    for (const witness of limb.floorPoints!) {
      const local: IAutoMovieVector3 = Quaternion.rotateVector(
        Quaternion.inverse(shape.transform.rotation),
        Vector3.subtract(witness.localPoint, shape.transform.position),
      );
      if (
        Math.abs(local.y + shape.halfExtents.y) > 1e-10 ||
        Math.abs(Math.abs(local.x) - shape.halfExtents.x) > 1e-10 ||
        Math.abs(Math.abs(local.z) - shape.halfExtents.z) > 1e-10 ||
        Math.abs(world(segment, witness.localPoint).y - SOLE) > 1e-10
      )
        failures.push(`${limb.bone}: witness leaves the actual source face`);
    }
  }

  // Recovery bracing stays inside the standing body.
  const bracing: ReturnType<typeof AutoMovieHumanPhysicalBracing> =
    AutoMovieHumanPhysicalBracing(profile);
  if (
    !(
      bracing.minimumCenterHeight > 0 &&
      bracing.minimumCenterHeight < profile.centerOfMass.y &&
      bracing.maximumRootShift > 0 &&
      bracing.maximumRootShift < profile.centerOfMass.y
    )
  )
    failures.push("standing recovery envelope");
  TestValidator.equals("Human physical mapping", failures, []);

  // Inputs the mapping cannot honour are refused.
  const skewed: Source = polygonPerson();
  skewed.segments.find(
    (segment: Source.ISegment): boolean => segment.bone === "chest",
  )!.coordinates[1]!.direction = Vector3.normalize({ x: 0.1, y: 0, z: 1 });
  const refusals: string[] = [];
  for (const [label, run] of [
    ["skewed", (): P => mapAutoMovieHumanPhysicalProfile(skewed, options())],
    [
      "massless",
      (): P =>
        mapAutoMovieHumanPhysicalProfile(polygonPerson(), {
          ...options(),
          mass: 0,
        }),
    ],
  ] as const)
    try {
      run();
      refusals.push(`${label} accepted`);
    } catch {}
  TestValidator.equals("refused sources", refusals, []);
}

/** World height of the declared foot soles. */
const SOLE: number = 0.01;

/** Actuator and material assumptions of the mapping, with one glove. */
function options(): AutoMovieHumanPhysicalProfile.IOptions {
  return {
    mass: 80,
    frequency: 20,
    dampingRatio: 1,
    torquePerKg: 50,
    passiveRate: 5,
    equipment: [
      {
        bone: "leftHand",
        mass: 0.3,
        centerOfMass: { x: 0, y: -0.05, z: 0 },
        inertia: { x: 0.001, y: 0.001, z: 0.001 },
        shape: {
          id: "glove",
          kind: "sphere",
          radius: 0.06,
          material: "skin",
          transform: {
            position: { x: 0, y: -0.05, z: 0 },
            rotation: { x: 0, y: 0, z: 0, w: 1 },
          },
        },
      },
    ],
    materials: [
      { id: "skin", friction: 0.7, restitution: 0, compliance: 0, damping: 0 },
    ],
    skin: "skin",
  };
}

/**
 * A polygon person: a standing stick figure 1.85 m tall with box feet. Every
 * bone frame is rotated by its own angle so localization errors are visible;
 * a ball joint authors three coordinates whose third is opposite the frame's
 * completing axis, a hinge one.
 */
function polygonPerson(): Source {
  const segments: Source.ISegment[] = [];
  const add: (
    bone: string,
    parent: string | null,
    position: IAutoMovieVector3,
    radius: number,
    solid: Source.ICapsule | Source.IBox,
    hinge?: boolean,
  ) => void = (
    bone: string,
    parent: string | null,
    position: IAutoMovieVector3,
    radius: number,
    solid: Source.ICapsule | Source.IBox,
    hinge: boolean = false,
  ): void => {
    const angle: number = 0.2 + 0.1 * segments.length;
    const rotation: IAutoMovieQuaternion = Quaternion.normalize({
      x: Math.sin(angle) * 0.6,
      y: Math.sin(angle) * 0.8,
      z: 0,
      w: Math.cos(angle),
    });
    segments.push({
      bone,
      parent,
      neutral: { position, rotation },
      radius,
      solid,
      coordinates:
        parent === null
          ? []
          : hinge
            ? [coordinate(bone, "flexion", { x: 1, y: 0, z: 0 })]
            : [
                coordinate(bone, "flexion", { x: 1, y: 0, z: 0 }),
                coordinate(bone, "abduction", { x: 0, y: 0, z: 1 }),
                coordinate(bone, "rotation", { x: 0, y: 1, z: 0 }),
              ],
    });
  };
  const capsule: (x: number, y: number, z: number) => Source.ICapsule = (
    x: number,
    y: number,
    z: number,
  ): Source.ICapsule => ({ kind: "capsule", end: { x, y, z } });
  add("hips", null, { x: 0, y: 1, z: 0 }, 0.12, capsule(0, 1.1, 0));
  add("spine", "hips", { x: 0, y: 1.1, z: 0 }, 0.12, capsule(0, 1.3, 0));
  add("chest", "spine", { x: 0, y: 1.3, z: 0 }, 0.14, capsule(0, 1.5, 0));
  add("neck", "chest", { x: 0, y: 1.5, z: 0 }, 0.05, capsule(0, 1.6, 0));
  add("head", "neck", { x: 0, y: 1.6, z: 0 }, 0.09, capsule(0, 1.85, 0));
  for (const side of [1, -1]) {
    const name: string = side === 1 ? "left" : "right";
    const x: number = 0.1 * side;
    add(
      `${name}Shoulder`,
      "chest",
      { x: 0.05 * side, y: 1.45, z: 0 },
      0.05,
      capsule(0.2 * side, 1.45, 0),
    );
    add(
      `${name}UpperArm`,
      `${name}Shoulder`,
      { x: 0.2 * side, y: 1.45, z: 0 },
      0.045,
      capsule(0.2 * side, 1.15, 0),
    );
    add(
      `${name}LowerArm`,
      `${name}UpperArm`,
      { x: 0.2 * side, y: 1.15, z: 0 },
      0.04,
      capsule(0.2 * side, 0.9, 0),
      true,
    );
    add(
      `${name}Hand`,
      `${name}LowerArm`,
      { x: 0.2 * side, y: 0.9, z: 0 },
      0.035,
      capsule(0.2 * side, 0.8, 0),
    );
    add(
      `${name}UpperLeg`,
      "hips",
      { x, y: 1, z: 0 },
      0.08,
      capsule(x, 0.55, 0),
    );
    add(
      `${name}LowerLeg`,
      `${name}UpperLeg`,
      { x, y: 0.55, z: 0 },
      0.06,
      capsule(x, 0.1, 0),
      true,
    );
    add(
      `${name}Foot`,
      `${name}LowerLeg`,
      { x, y: 0.1, z: 0 },
      0.04,
      capsule(x, 0.06, 0.02),
    );
    add(
      `${name}Subtalar`,
      `${name}Foot`,
      { x, y: 0.06, z: 0.02 },
      0.035,
      box(x, 0.01, -0.05, 0.07),
      true,
    );
    add(
      `${name}Midfoot`,
      `${name}Subtalar`,
      { x, y: 0.04, z: 0.07 },
      0.03,
      box(x, 0.01, 0.07, 0.19),
      true,
    );
  }
  return { sex: "male", segments };
}

/** One authored coordinate of a bone with a symmetric clinical range. */
function coordinate(
  bone: string,
  name: string,
  direction: IAutoMovieVector3,
): Source.ICoordinate {
  return { channel: `${bone}.${name}`, direction, minimum: -30, maximum: 60 };
}

/** A forward-pointing foot box from heel to toe along +z, standing on the sole. */
function box(x: number, sole: number, heel: number, toe: number): Source.IBox {
  const half: number = Math.SQRT1_2;
  return {
    kind: "box",
    center: { x, y: sole + 0.025, z: (heel + toe) / 2 },
    rotation: { x: 0, y: -half, z: 0, w: half },
    halfExtents: { x: (toe - heel) / 2, y: 0.025, z: 0.045 },
  };
}

/** Neutral skeletal placements the support reader takes its ball landmarks from. */
function placements(source: Source): AutoMovieHumanSkeleton.IPlacement[] {
  const output: AutoMovieHumanSkeleton.IPlacement[] = source.segments.map(
    (segment: Source.ISegment): AutoMovieHumanSkeleton.IPlacement => ({
      bone: segment.bone,
      position: [
        segment.neutral.position.x,
        segment.neutral.position.y,
        segment.neutral.position.z,
      ],
      rotation: [
        segment.neutral.rotation.x,
        segment.neutral.rotation.y,
        segment.neutral.rotation.z,
        segment.neutral.rotation.w,
      ],
    }),
  );
  for (const [side, x] of [
    ["left", 0.1],
    ["right", -0.1],
  ] as const)
    for (const [toe, offset] of [
      ["HalluxProximal", 0.03],
      ["Toe5Proximal", -0.03],
    ] as const)
      output.push({
        bone: `${side}${toe}`,
        position: [x + (side === "left" ? offset : -offset), 0.03, 0.15],
        rotation: [0, 0, 0, 1],
      });
  return output;
}
