import {
  DEFAULT_HUMANOID_ROM,
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
  curlChainUntilContact,
  resolvePose,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMoviePhysicalProfile,
  IAutoMoviePose,
  IAutoMovieSkeleton,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * Closing a finger until contact stops each phalanx at the object's surface,
 * never inside it, and never past the joint's range of motion.
 *
 * The rig is a kinematic chain fixture (a hand bone and an index finger of
 * three phalanges, 45, 25 and 20 mm, lying along +X with the palm toward -Y,
 * the canonical T-pose hand), the same kind of bare engine chain the other
 * kinematics tests use; finger radius 8 mm.
 *
 * Scenarios:
 * 1. A box under the finger: after the curl, every point of every phalanx
 *    lies at least the radius from the box and the least clearance is under
 *    2 mm, judged by an independent dense sampling of the phalanx segments
 *    against the box's analytic distance.
 * 2. The same with a sphere and with a capsule across the finger.
 * 3. An object beyond reach: every joint ends exactly at the default finger
 *    range maximum and the reported gap is positive.
 * 4. A finger already pressing into the object does not move.
 * 5. Proximal-first closing: with a small sphere under the proximal phalanx
 *    only, the proximal joint stops at the contact short of its range and the
 *    middle joint keeps closing after it (the GraspIt! rule), still without
 *    entering the sphere.
 * 6. Two runs give bit-identical angles; a non-positive radius or step throws.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs the public curl and reads the curled pose through forward kinematics; a phalanx stopped inside the object, stopped far from it, pushed past its range, a moved pressing finger or a distal joint frozen by a proximal contact fails.
 * @evidence contracts/development/testing.md#independent-expectations Clearances come from 400-point sampling of each phalanx against closed-form sphere, capsule and box distances written here, not from the curl's own distance; the 2 mm bound is the campaign's grasp acceptance (#3201 step 5); the range is DEFAULT_HUMANOID_ROM's finger flexion maximum.
 * @evidence contracts/development/testing.md#distinguishing-cases Three shape kinds, a reachable and an unreachable object, an initial penetration, a proximal-only contact, determinism and invalid input.
 * @evidence contracts/development/testing.md#execution-ownership A pure in-memory engine unit with no body or render; it runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 6 scenarios and what each pins.
 */
export function test_motion_handling_curl(): void {
  const skeleton: IAutoMovieSkeleton = finger();
  const pose: IAutoMoviePose = {
    skeleton: skeleton.id,
    root: null,
    joints: [],
  };
  const chain: curlChainUntilContact.IChain = {
    bones: BONES,
    tip: { x: 0.02, y: 0, z: 0 },
    radius: RADIUS,
  };
  const curl = (
    colliders: curlChainUntilContact.ICollider[],
    start: IAutoMoviePose = pose,
  ): curlChainUntilContact.IResult =>
    curlChainUntilContact({
      skeleton,
      pose: start,
      chains: [chain],
      colliders,
      jointAxes: HUMANOID_JOINT_AXES,
      restFrames: HUMANOID_REST_FRAME,
    });
  const maximum: number = DEFAULT_HUMANOID_ROM.leftIndexProximal!.flexion!.max;

  // 1-2. Each shape kind under the finger: the curl ends touching, not inside.
  const below = (
    shape: IAutoMoviePhysicalProfile.IShape,
  ): curlChainUntilContact.ICollider => ({
    shape,
    frame: { position: { x: 0, y: 0, z: 0 }, rotation: Quaternion.identity() },
  });
  const cases: { label: string; collider: curlChainUntilContact.ICollider }[] =
    [
      {
        label: "box",
        collider: below(
          box({ x: 0.1, y: -0.05, z: 0 }, { x: 0.06, y: 0.02, z: 0.05 }),
        ),
      },
      {
        label: "sphere",
        collider: below({
          id: "s",
          material: "m",
          transform: {
            position: { x: 0.08, y: -0.045, z: 0 },
            rotation: Quaternion.identity(),
          },
          kind: "sphere",
          radius: 0.03,
        }),
      },
      {
        label: "capsule",
        collider: below({
          id: "c",
          material: "m",
          transform: {
            position: { x: 0.07, y: -0.04, z: 0 },
            rotation: Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, 90),
          },
          kind: "capsule",
          radius: 0.02,
          halfLength: 0.05,
        }),
      },
    ];
  for (const { label, collider } of cases) {
    const result: curlChainUntilContact.IResult = curl([collider]);
    const least: number = clearance(skeleton, result.pose, collider);
    TestValidator.predicate(
      `${label}: touches without penetrating (${(least * 1000).toFixed(3)} mm)`,
      least >= -1e-6 && least <= 0.002,
    );
    TestValidator.predicate(
      `${label}: within range`,
      result.chains[0]!.flexion.every(
        (a: number): boolean => a >= 0 && a <= maximum + 1e-9,
      ),
    );
  }

  // 3. Out of reach: every joint at its range maximum, the gap positive.
  const far: curlChainUntilContact.ICollider = below(
    box({ x: 0.1, y: -0.5, z: 0 }, { x: 0.05, y: 0.05, z: 0.05 }),
  );
  const free: curlChainUntilContact.IResult = curl([far]);
  TestValidator.predicate(
    "unreached joints stop at the range maximum",
    free.chains[0]!.flexion.every(
      (a: number): boolean => Math.abs(a - maximum) < 1e-9,
    ),
  );
  TestValidator.predicate(
    "unreached gap is positive",
    free.chains[0]!.gap > 0.1,
  );

  // 4. Already pressing: unchanged.
  const pressing: curlChainUntilContact.ICollider = below(
    box({ x: 0.06, y: -0.01, z: 0 }, { x: 0.05, y: 0.01, z: 0.05 }),
  );
  const kept: curlChainUntilContact.IResult = curl([pressing]);
  TestValidator.predicate(
    "a pressing finger keeps its angles",
    kept.chains[0]!.flexion.every((a: number): boolean => a === 0),
  );

  // 5. A sphere under the proximal phalanx only: proximal stops, the rest close on.
  const knob: curlChainUntilContact.ICollider = below({
    id: "k",
    material: "m",
    transform: {
      position: { x: 0.022, y: -0.03, z: 0 },
      rotation: Quaternion.identity(),
    },
    kind: "sphere",
    radius: 0.015,
  });
  const staged: curlChainUntilContact.IResult = curl([knob]);
  const [proximal, middle, distal] = staged.chains[0]!.flexion as [
    number,
    number,
    number,
  ];
  TestValidator.predicate(
    `proximal stops at the knob (${proximal.toFixed(2)})`,
    proximal > 0 && proximal < maximum,
  );
  TestValidator.predicate(
    `distal joints keep closing (${middle.toFixed(2)}, ${distal.toFixed(2)})`,
    middle > 1 && distal >= 0,
  );
  TestValidator.predicate(
    "the knob is touched, not entered",
    clearance(skeleton, staged.pose, knob) >= -1e-6,
  );

  // 6. Determinism and refusals.
  const again: curlChainUntilContact.IResult = curl([cases[0]!.collider]);
  TestValidator.predicate(
    "bit-identical",
    JSON.stringify(again.chains) ===
      JSON.stringify(curl([cases[0]!.collider]).chains),
  );
  TestValidator.error("zero radius", (): unknown =>
    curlChainUntilContact({
      skeleton,
      pose,
      chains: [{ ...chain, radius: 0 }],
      colliders: [far],
    }),
  );
  TestValidator.error("zero step", (): unknown =>
    curlChainUntilContact({
      skeleton,
      pose,
      chains: [chain],
      colliders: [far],
      step: 0,
    }),
  );
}

/** The finger's bones, proximal to distal. */
const BONES: AutoMovieHumanoidBone[] = [
  "leftIndexProximal",
  "leftIndexIntermediate",
  "leftIndexDistal",
];

/** Phalanx radius, metres. */
const RADIUS: number = 0.008;

/** A hand at the origin with one index finger along +X. */
function finger(): IAutoMovieSkeleton {
  const bone = (
    name: AutoMovieHumanoidBone,
    parent: AutoMovieHumanoidBone | null,
    x: number,
  ): IAutoMovieBone => ({
    bone: name,
    parent,
    rest: {
      translation: { x, y: 0, z: 0 },
      rotation: Quaternion.identity(),
      scale: { x: 1, y: 1, z: 1 },
    },
    constraint: null,
  });
  return {
    id: "finger",
    bones: [
      bone("leftHand", null, 0),
      bone("leftIndexProximal", "leftHand", 0),
      bone("leftIndexIntermediate", "leftIndexProximal", 0.045),
      bone("leftIndexDistal", "leftIndexIntermediate", 0.025),
    ],
  };
}

/** A box shape centred at a point with half extents. */
function box(
  at: IAutoMovieVector3,
  half: IAutoMovieVector3,
): IAutoMoviePhysicalProfile.IShape {
  return {
    id: "b",
    material: "m",
    transform: { position: at, rotation: Quaternion.identity() },
    kind: "box",
    halfExtents: half,
  };
}

/** Least surface clearance of the curled phalanges from a collider, by dense sampling against closed-form distances. */
function clearance(
  skeleton: IAutoMovieSkeleton,
  pose: IAutoMoviePose,
  collider: curlChainUntilContact.ICollider,
): number {
  const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = new Map(
    resolvePose(pose, skeleton, HUMANOID_JOINT_AXES, HUMANOID_REST_FRAME).map(
      (
        r: IAutoMovieResolvedBone,
      ): [AutoMovieHumanoidBone, IAutoMovieResolvedBone] => [r.bone, r],
    ),
  );
  const points: IAutoMovieVector3[] = BONES.map(
    (b: AutoMovieHumanoidBone): IAutoMovieVector3 =>
      bones.get(b)!.worldPosition,
  );
  const distal: IAutoMovieResolvedBone = bones.get("leftIndexDistal")!;
  points.push(
    Vector3.add(
      distal.worldPosition,
      Quaternion.rotateVector(distal.worldRotation, { x: 0.02, y: 0, z: 0 }),
    ),
  );
  const shape: IAutoMoviePhysicalProfile.IShape = collider.shape;
  const c: IAutoMovieVector3 = shape.transform.position;
  const distance = (p: IAutoMovieVector3): number => {
    if (shape.kind === "sphere")
      return Vector3.length(Vector3.subtract(p, c)) - shape.radius;
    if (shape.kind === "capsule") {
      const axis: IAutoMovieVector3 = Quaternion.rotateVector(
        shape.transform.rotation,
        { x: 0, y: 1, z: 0 },
      );
      const t: number = Math.max(
        -shape.halfLength,
        Math.min(shape.halfLength, Vector3.dot(Vector3.subtract(p, c), axis)),
      );
      return (
        Vector3.length(
          Vector3.subtract(p, Vector3.add(c, Vector3.scale(axis, t))),
        ) - shape.radius
      );
    }
    const q: IAutoMovieVector3 = {
      x: Math.abs(p.x - c.x) - shape.halfExtents.x,
      y: Math.abs(p.y - c.y) - shape.halfExtents.y,
      z: Math.abs(p.z - c.z) - shape.halfExtents.z,
    };
    return (
      Math.hypot(Math.max(q.x, 0), Math.max(q.y, 0), Math.max(q.z, 0)) +
      Math.min(Math.max(q.x, q.y, q.z), 0)
    );
  };
  let least: number = Infinity;
  for (let i: number = 0; i + 1 < points.length; i++)
    for (let k: number = 0; k <= 400; k++)
      least = Math.min(
        least,
        distance(Vector3.lerp(points[i]!, points[i + 1]!, k / 400)) - RADIUS,
      );
  return least;
}
