import {
  Quaternion,
  Vector3,
  physicalStanceBalance,
  physicalStanceSupport,
  physicalStanceSwing,
  physicalSupportFootprint,
} from "@automovie/engine";
import type {
  IAutoMovieFootfallPattern,
  IAutoMoviePhysicalProfile,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PhysicalModelFixtures } from "../../../internal/PhysicalModelFixtures";

/** The sole's half-width along x, half-length along z and height, metres. */
const [WIDTH, LENGTH, HEIGHT] = [0.05, 0.08, 0.02];

/**
 * A support patch's footprint is its bearing face, not every vertex of its
 * shapes projected down: only the vertices within the foot-lift bound (5 mm) of
 * the patch's lowest bear on the floor.
 *
 * 1. A flat box-shaped sole hull projects its four bottom corners; its top
 *    corners, 20 mm up, are left out.
 * 2. The same sole rolled 10 degrees about its length bears on its low edge alone:
 *    the two corners there, the far edge 17 mm up left out.
 * 3. The shared support polygon (`physicalStanceSupport.polygon`) is the flat face
 *    shrunk by the margin, and a ray from its centre meets it the half-width
 *    less the margin away.
 * 4. A leg's effective swing mass (`physicalStanceSwing.swingMass`) is its first
 *    moment about the hip over the endpoint's distance, within the leg's mass.
 */
export function test_unit_engine_physics_physical_support_footprint_face(): void {
  const failures: string[] = [];
  const base: IAutoMoviePhysicalProfile = PhysicalModelFixtures.quadrupod();
  const bone: string = "support-0";
  const corners: IAutoMovieVector3[] = [];
  for (const x of [-WIDTH, WIDTH])
    for (const y of [0, HEIGHT])
      for (const z of [-LENGTH, LENGTH]) corners.push({ x, y, z });
  const profile: IAutoMoviePhysicalProfile = {
    ...base,
    segments: base.segments.map((segment) =>
      segment.bone === bone
        ? {
            ...segment,
            shapes: [
              {
                id: "sole",
                material: segment.shapes[0]!.material,
                transform: {
                  position: { x: 0, y: 0, z: 0 },
                  rotation: { x: 0, y: 0, z: 0, w: 1 },
                },
                kind: "hull" as const,
                points: corners,
              },
            ],
          }
        : segment,
    ),
  };
  const limb: IAutoMovieFootfallPattern["limbs"][number] = {
    bone,
    chain: [bone],
    phase: 0,
    duty: 0.5,
    offset: { forward: 0, left: 0 },
    stride: [{ speed: 0, length: 0 }],
  };
  const at = (pose: IAutoMovieRigidTransform): IAutoMovieVector3[] =>
    physicalSupportFootprint(profile, { [bone]: pose }, limb, 0);

  const flat: IAutoMovieVector3[] = at({
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
  });
  if (flat.length !== 4)
    failures.push(
      `a flat sole projects ${flat.length} points, not its four bottom corners`,
    );

  // 3. The shared support polygon is that face shrunk by the margin, and its
  // ray from the centre along +x meets it WIDTH - MARGIN away.
  const polygon: IAutoMovieVector3[] = physicalStanceSupport.polygon(
    profile,
    {
      [bone]: {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
      },
    },
    [limb],
    0,
  );
  if (
    polygon.length !== 4 ||
    !polygon.every(
      (p) =>
        Math.abs(Math.abs(p.x) - (WIDTH - physicalStanceBalance.MARGIN)) <
          1e-9 &&
        Math.abs(Math.abs(p.z) - (LENGTH - physicalStanceBalance.MARGIN)) <
          1e-9,
    )
  )
    failures.push(`the shared polygon is ${JSON.stringify(polygon)}`);
  const ray: number = physicalStanceSwing.reach(
    polygon,
    { x: 0, y: 0, z: 0 },
    { x: 1, y: 0, z: 0 },
  );
  if (!(Math.abs(ray - (WIDTH - physicalStanceBalance.MARGIN)) < 1e-9))
    failures.push(`the ray meets the polygon ${ray} m away`);

  // 4. A leg's effective swing mass at the fixture's neutral pose: its
  // segments' first moment about the hip over the endpoint's distance.
  const neutral: Record<string, IAutoMovieRigidTransform> = Object.fromEntries(
    base.segments.map((segment) => [segment.bone, segment.neutral]),
  );
  const leg: IAutoMovieFootfallPattern["limbs"][number] = {
    ...limb,
    chain: ["upper-0", "lower-0", "support-0"],
  };
  const joint = base.joints.find((j) => j.child === "upper-0")!;
  const hip: IAutoMovieVector3 = Vector3.add(
    neutral[joint.parent]!.position,
    Quaternion.rotateVector(
      neutral[joint.parent]!.rotation,
      joint.parentFrame.position,
    ),
  );
  const end: IAutoMovieVector3 = neutral[bone]!.position;
  let moment: number = 0;
  let mass: number = 0;
  for (const name of leg.chain) {
    const segment = base.segments.find((s) => s.bone === name)!;
    const center: IAutoMovieVector3 = Vector3.add(
      neutral[name]!.position,
      Quaternion.rotateVector(neutral[name]!.rotation, segment.centerOfMass),
    );
    moment += segment.mass * Vector3.length(Vector3.subtract(center, hip));
    mass += segment.mass;
  }
  const effective: number = physicalStanceSwing.swingMass(
    base,
    // The neutral pose as the rigid poses the swing reads.
    new Map(
      Object.entries(neutral).map(
        ([bone, at]: [string, IAutoMovieRigidTransform]) => [
          bone,
          {
            translation: (): IAutoMovieVector3 => at.position,
            rotation: (): IAutoMovieQuaternion => at.rotation,
          },
        ],
      ),
    ),
    leg,
  );
  const expected: number = moment / Vector3.length(Vector3.subtract(end, hip));
  if (
    !(Math.abs(effective - expected) < 1e-9) ||
    !(effective > 0 && effective <= mass)
  )
    failures.push(
      `the leg's effective swing mass is ${effective}, not ${expected} within (0, ${mass}]`,
    );

  // Rolled 10 degrees about z: the corners at x = -WIDTH drop, the others rise.
  const rolled: IAutoMovieVector3[] = at({
    position: { x: 0, y: 0, z: 0 },
    rotation: Quaternion.fromAxisAngle({ x: 0, y: 0, z: 1 }, 10),
  });
  const low: number = -WIDTH * Math.cos((10 * Math.PI) / 180);
  if (
    rolled.length !== 2 ||
    !rolled.every((point) => Math.abs(point.x - low) < 1e-6)
  )
    failures.push(
      `a rolled sole bears on ${JSON.stringify(rolled)}, not its low edge at x ${low}`,
    );
  TestValidator.equals("support footprint bearing face", failures, []);
}
