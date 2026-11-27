import { AutoMovieEngineQuaternion, AutoMovieEngineVector3, AutoMovieEnginePhysicalStanceBalance, AutoMovieEnginePhysicalStanceSupport, AutoMovieEnginePhysicalStanceSwing, AutoMovieEnginePhysics } from "@automovie/engine";
import type {
  IAutoMovieFootfallPattern,
  IAutoMoviePhysicalProfile,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PhysicalModelFixtures } from "../../internal/PhysicalModelFixtures";
import { PhysicalTolerance } from "../../internal/PhysicalTolerance";

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
 * 3. The shared support polygon (`AutoMovieEnginePhysicalStanceSupport.polygon`) is the flat face
 *    shrunk by the margin, and a ray from its centre meets it the half-width
 *    less the margin away.
 * 4. A leg's effective swing mass (`AutoMovieEnginePhysicalStanceSwing.swingMass`) is its first
 *    moment about the hip over the endpoint's distance, within the leg's mass.
 * 5. `AutoMovieEnginePhysicalStanceSupport.shrink` takes a 0.2 m square in by 0.02 m on every
 *    side; `support` keeps a narrow foot's own three vertices, bears a lifted
 *    foot at its ankle and an unseated one on its edge, shrinks the feet's
 *    union by the margin from every hull edge, and keeps area for two
 *    edge-borne feet and for a seated tripod with a rear toe edge; `shorten`
 *    takes the margin off an edge along its length only.
 */
export function test_engine_physics_physical_stance_support(): void {
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
    AutoMovieEnginePhysics.supportFootprint(profile, { [bone]: pose }, limb, 0);

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
  const polygon: IAutoMovieVector3[] = AutoMovieEnginePhysicalStanceSupport.polygon(
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
        Math.abs(Math.abs(p.x) - (WIDTH - AutoMovieEnginePhysicalStanceBalance.MARGIN)) <
          PhysicalTolerance.ACCUMULATED &&
        Math.abs(Math.abs(p.z) - (LENGTH - AutoMovieEnginePhysicalStanceBalance.MARGIN)) <
          PhysicalTolerance.ACCUMULATED,
    )
  )
    failures.push(`the shared polygon is ${JSON.stringify(polygon)}`);
  const ray: number = AutoMovieEnginePhysicalStanceSwing.reach(
    polygon,
    { x: 0, y: 0, z: 0 },
    { x: 1, y: 0, z: 0 },
  );
  if (
    !(
      Math.abs(ray - (WIDTH - AutoMovieEnginePhysicalStanceBalance.MARGIN)) <
      PhysicalTolerance.ACCUMULATED
    )
  )
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
  const hip: IAutoMovieVector3 = AutoMovieEngineVector3.add(
    neutral[joint.parent]!.position,
    AutoMovieEngineQuaternion.rotateVector(
      neutral[joint.parent]!.rotation,
      joint.parentFrame.position,
    ),
  );
  const end: IAutoMovieVector3 = neutral[bone]!.position;
  let moment: number = 0;
  let mass: number = 0;
  for (const name of leg.chain) {
    const segment = base.segments.find((s) => s.bone === name)!;
    const center: IAutoMovieVector3 = AutoMovieEngineVector3.add(
      neutral[name]!.position,
      AutoMovieEngineQuaternion.rotateVector(neutral[name]!.rotation, segment.centerOfMass),
    );
    moment += segment.mass * AutoMovieEngineVector3.length(AutoMovieEngineVector3.subtract(center, hip));
    mass += segment.mass;
  }
  const effective: number = AutoMovieEnginePhysicalStanceSwing.swingMass(
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
  const expected: number = moment / AutoMovieEngineVector3.length(AutoMovieEngineVector3.subtract(end, hip));
  if (
    !(Math.abs(effective - expected) < PhysicalTolerance.ACCUMULATED) ||
    !(effective > 0 && effective <= mass)
  )
    failures.push(
      `the leg's effective swing mass is ${effective}, not ${expected} within (0, ${mass}]`,
    );

  // Rolled 10 degrees about z: the corners at x = -WIDTH drop, the others rise.
  const rolled: IAutoMovieVector3[] = at({
    position: { x: 0, y: 0, z: 0 },
    rotation: AutoMovieEngineQuaternion.fromAxisAngle({ x: 0, y: 0, z: 1 }, 10),
  });
  const low: number = -WIDTH * Math.cos((10 * Math.PI) / 180);
  if (
    rolled.length !== 2 ||
    !rolled.every(
      (point) => Math.abs(point.x - low) < PhysicalTolerance.CONVERGED,
    )
  )
    failures.push(
      `a rolled sole bears on ${JSON.stringify(rolled)}, not its low edge at x ${low}`,
    );
  // 5. Shrinking, bearing and shortening.
  const near = (name: string, actual: number, expected: number): void => {
    if (
      !(
        Math.abs(actual - expected) <=
        PhysicalTolerance.ACCUMULATED * Math.max(1, Math.abs(expected))
      )
    )
      failures.push(`${name}: ${actual} against ${expected}`);
  };
  const square: IAutoMovieVector3[] = [
    { x: -0.1, y: 0, z: -0.1 },
    { x: 0.1, y: 0, z: -0.1 },
    { x: 0.1, y: 0, z: 0.1 },
    { x: -0.1, y: 0, z: 0.1 },
  ];
  const shrunk: IAutoMovieVector3[] = AutoMovieEnginePhysicalStanceSupport.shrink(
    square,
    0.02,
  );
  near("shrunk vertices", shrunk.length, 4);
  for (const vertex of shrunk) {
    near("shrunk |x|", Math.abs(vertex.x), 0.08);
    near("shrunk |z|", Math.abs(vertex.z), 0.08);
  }
  const narrow: IAutoMovieVector3[] = [
    { x: 0.1, y: 0, z: 0 },
    { x: 0.13, y: 0, z: 0.15 },
    { x: 0.07, y: 0, z: 0.15 },
  ];
  const borne = AutoMovieEnginePhysicalStanceSupport.support([
    {
      limb: "left",
      outline: narrow,
      flat: 1,
      ankle: { x: 0.1, y: 0, z: 0.02 },
    },
    {
      limb: "right",
      outline: narrow.map((p) => ({ ...p, x: -p.x })),
      flat: 1,
      ankle: { x: -0.1, y: 0, z: 0.02 },
    },
    { limb: "lifted", outline: narrow, flat: 0, ankle: { x: 0.3, y: 0, z: 0 } },
  ]);
  near("narrow foot vertices", borne.feet[0]!.points.length, 3);
  near("narrow foot heel z", borne.feet[0]!.points[0]!.z, 0);
  near("lifted foot points", borne.feet[2]!.points.length, 1);
  near("lifted foot at its ankle", borne.feet[2]!.points[0]!.x, 0.3);
  const union: IAutoMovieVector3[] = [
    { x: -0.1, y: 0, z: 0 },
    { x: 0.3, y: 0, z: 0 },
    { x: 0.13, y: 0, z: 0.15 },
    { x: -0.13, y: 0, z: 0.15 },
  ];
  if (!(borne.polygon.length >= 3))
    failures.push(`the shrunken union has ${borne.polygon.length} vertices`);
  for (const vertex of borne.polygon.filter(
    (v) =>
      !(
        Math.abs(v.x - 0.3) < PhysicalTolerance.ACCUMULATED &&
        Math.abs(v.z) < PhysicalTolerance.ACCUMULATED
      ),
  ))
    union.forEach((a: IAutoMovieVector3, i: number): void => {
      const b: IAutoMovieVector3 = union[(i + 1) % union.length]!;
      const depth: number =
        ((b.x - a.x) * (vertex.z - a.z) - (b.z - a.z) * (vertex.x - a.x)) /
        Math.hypot(b.x - a.x, b.z - a.z);
      if (
        !(
          Math.abs(depth) >=
          AutoMovieEnginePhysicalStanceBalance.MARGIN - PhysicalTolerance.ACCUMULATED
        )
      )
        failures.push(
          `command vertex ${JSON.stringify(vertex)} inside the margin`,
        );
    });
  const edged = AutoMovieEnginePhysicalStanceSupport.support([
    {
      limb: "edge",
      outline: square,
      flat: 0,
      ankle: { x: 0, y: 0, z: 0 },
      edge: [
        { x: 0.1, y: 0, z: -0.1 },
        { x: 0.1, y: 0, z: 0.1 },
      ],
    },
  ]);
  near("edge-borne points", edged.feet[0]!.points.length, 2);
  near("edge-borne x", edged.feet[0]!.points[0]!.x, 0.1);
  const two = AutoMovieEnginePhysicalStanceSupport.support([
    {
      limb: "toe",
      outline: square,
      flat: 0,
      ankle: { x: 0.1, y: 0, z: 0 },
      edge: [
        { x: 0.05, y: 0, z: 0.2 },
        { x: 0.15, y: 0, z: 0.2 },
      ],
    },
    {
      limb: "side",
      outline: square,
      flat: 0,
      ankle: { x: -0.1, y: 0, z: 0 },
      edge: [
        { x: -0.15, y: 0, z: 0 },
        { x: -0.15, y: 0, z: 0.2 },
      ],
    },
  ]);
  if (!(two.polygon.length >= 3))
    failures.push(`two edge-borne feet give ${two.polygon.length} vertices`);
  const stepping = AutoMovieEnginePhysicalStanceSupport.support([
    {
      limb: "landed",
      outline: [
        { x: -0.1, y: 0, z: 0.45 },
        { x: -0.08, y: 0, z: 0.6 },
        { x: -0.116, y: 0, z: 0.61 },
      ],
      flat: 1,
      ankle: { x: -0.1, y: 0, z: 0.47 },
    },
    {
      limb: "rear",
      outline: square,
      flat: 0,
      ankle: { x: 0.1, y: 0, z: 0 },
      edge: [
        { x: 0.07, y: 0, z: 0.15 },
        { x: 0.13, y: 0, z: 0.15 },
      ],
    },
  ]);
  const zs: number[] = stepping.polygon.map((p) => p.z);
  if (
    !(stepping.polygon.length >= 3) ||
    !(Math.max(...zs) > 0.5 && Math.min(...zs) < 0.2)
  )
    failures.push("a seated tripod and a rear edge do not span both feet");
  const shortened = AutoMovieEnginePhysicalStanceSupport.shorten(
    [
      { x: 0, y: 0, z: 0 },
      { x: 0.2, y: 0, z: 0 },
    ],
    AutoMovieEnginePhysicalStanceBalance.MARGIN,
  );
  near("shortened start", shortened[0]!.x, AutoMovieEnginePhysicalStanceBalance.MARGIN);
  near("shortened end", shortened[1]!.x, 0.2 - AutoMovieEnginePhysicalStanceBalance.MARGIN);
  near("shortened across", shortened[0]!.z, 0);
  TestValidator.equals("support footprint bearing face", failures, []);
}
