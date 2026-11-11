import { indexSkeletonTopology } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieSkeleton,
  IAutoMovieVector3,
} from "@automovie/interface";
import { AutoMovieMotionHumanBend, type IHumanBody } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

/**
 * The elbow a hand goal takes when no bend is stated: the place of least
 * strain among the places the arm's ranges allow.
 *
 * The body is a hand-built rig in a T pose with identity rest rotations and
 * the engine's default ranges: the hips at 0.9 m, the shoulder joints at
 * (±0.2, 1.4, 0), an upper arm of 0.3 m and a forearm of 0.25 m, so an arm
 * of 0.55 m. It has no contact shapes. The rig origin stands at the world
 * origin heading +Z, where x is the performer's left.
 *
 * Scenarios:
 * 1. A wrist at (0.35, 1.2, 0.3) solved twice gives the same elbow, 0.3 m
 *    from the shoulder and 0.25 m from the wrist.
 * 2. The right arm's elbow for the wrist mirrored across the midline is the
 *    left arm's elbow mirrored.
 * 3. Every elbow of that wrist lies on a circle about the line from the
 *    shoulder to the wrist. The circle's 360 whole-degree points are built
 *    here from the two bone lengths; the strain at the solved elbow is no
 *    more than the strain at any of them that the ranges allow, some of
 *    them are refused or strain more, and the solved strain is finite.
 * 4. A hand low in front of the hip, at (0.25, 0.95, 0.1), has its elbow
 *    below the shoulder.
 * 5. A wrist 0.6 m out from the shoulder, past the arm's 0.55 m, throws;
 *    with a fallback preset the result is that preset's elbow.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public solver and reads the elbow and the strain; an elbow off the bones' lengths, a side that does not mirror, a place of more strain than an allowed neighbour, or a silent answer to an unreachable wrist fails.
 * @evidence contracts/development/testing.md#independent-expectations The circle of elbow places is built in the test from the stated lengths by the law of cosines, not by the solver; the mirror and the bone lengths are geometry of the stated rig.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers a repeat, both sides, the whole swivel circle, a second wrist with a known side of the shoulder, and a refusal with and without a fallback.
 * @evidence contracts/development/testing.md#execution-ownership An in-memory unit on a rig built here, because the solver reads a skeleton and no test body has one. An elbow kept out of the trunk's shapes and the hand rotation's strain read a real body and are judged by the motion captures. It runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation States the rig and the frame and lists the 5 scenarios with their numbers.
 */
export function test_motion_compose_swivel(): void {
  const bone = (
    name: AutoMovieHumanoidBone,
    parent: AutoMovieHumanoidBone | null,
    x: number,
    y: number,
  ): IAutoMovieBone => ({
    bone: name,
    parent,
    rest: {
      translation: { x, y, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      scale: { x: 1, y: 1, z: 1 },
    },
    constraint: null,
  });
  const skeleton: IAutoMovieSkeleton = {
    id: "swivel-rig",
    bones: [
      bone("hips", null, 0, 0.9),
      bone("spine", "hips", 0, 0.15),
      bone("chest", "spine", 0, 0.15),
      bone("upperChest", "chest", 0, 0.1),
      bone("leftShoulder", "upperChest", 0.05, 0.1),
      bone("leftUpperArm", "leftShoulder", 0.15, 0),
      bone("leftLowerArm", "leftUpperArm", 0.3, 0),
      bone("leftHand", "leftLowerArm", 0.25, 0),
      bone("rightShoulder", "upperChest", -0.05, 0.1),
      bone("rightUpperArm", "rightShoulder", -0.15, 0),
      bone("rightLowerArm", "rightUpperArm", -0.3, 0),
      bone("rightHand", "rightLowerArm", -0.25, 0),
    ],
  };
  const rest: Map<AutoMovieHumanoidBone, IAutoMovieVector3> = new Map();
  for (const b of skeleton.bones) {
    const parent: IAutoMovieVector3 =
      b.parent === null ? { x: 0, y: 0, z: 0 } : rest.get(b.parent)!;
    rest.set(b.bone, {
      x: parent.x + b.rest.translation.x,
      y: parent.y + b.rest.translation.y,
      z: parent.z + b.rest.translation.z,
    });
  }
  const body: IHumanBody = {
    skeleton,
    topology: indexSkeletonTopology(skeleton),
    rest,
    measure: { upperArm: 0.3, forearm: 0.25 },
    profile: { segments: [] },
  } as unknown as IHumanBody;
  const posture = { root: { x: 0, y: 0, z: 0 }, yaw: 0 };
  const distance = (a: IAutoMovieVector3, b: IAutoMovieVector3): number =>
    Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

  const shoulder: IAutoMovieVector3 = { x: 0.2, y: 1.4, z: 0 };
  const wrist: IAutoMovieVector3 = { x: 0.35, y: 1.2, z: 0.3 };
  const props: AutoMovieMotionHumanBend.ISolve = {
    body,
    posture,
    side: "left",
    point: wrist,
  };
  const elbow: IAutoMovieVector3 = AutoMovieMotionHumanBend.solve(props);
  TestValidator.predicate(
    "the same elbow twice, on the bones' lengths",
    distance(elbow, AutoMovieMotionHumanBend.solve(props)) === 0 &&
      Math.abs(distance(elbow, shoulder) - 0.3) <= 1e-6 &&
      Math.abs(distance(elbow, wrist) - 0.25) <= 1e-6,
  );

  const mirrored: IAutoMovieVector3 = AutoMovieMotionHumanBend.solve({
    body,
    posture,
    side: "right",
    point: { x: -wrist.x, y: wrist.y, z: wrist.z },
  });
  TestValidator.predicate(
    "the right arm mirrors the left",
    distance(mirrored, { x: -elbow.x, y: elbow.y, z: elbow.z }) <= 1e-6,
  );

  // The circle of elbow places: its centre lies `along` the line from the
  // shoulder to the wrist and its radius follows from the upper arm.
  const span: number = distance(shoulder, wrist);
  const axis: IAutoMovieVector3 = {
    x: (wrist.x - shoulder.x) / span,
    y: (wrist.y - shoulder.y) / span,
    z: (wrist.z - shoulder.z) / span,
  };
  const along: number = (0.3 ** 2 - 0.25 ** 2 + span ** 2) / (2 * span);
  const radius: number = Math.sqrt(0.3 ** 2 - along ** 2);
  // Two unit vectors across the axis: one from world up, one across both.
  const dot: number = axis.y;
  const uLength: number = Math.sqrt(1 - dot ** 2);
  const u: IAutoMovieVector3 = {
    x: (-dot * axis.x) / uLength,
    y: (1 - dot * axis.y) / uLength,
    z: (-dot * axis.z) / uLength,
  };
  const v: IAutoMovieVector3 = {
    x: axis.y * u.z - axis.z * u.y,
    y: axis.z * u.x - axis.x * u.z,
    z: axis.x * u.y - axis.y * u.x,
  };
  const solved: number = AutoMovieMotionHumanBend.strain(props, elbow);
  let allowed: number = 0;
  let worse: number = 0;
  let beaten: number = 0;
  for (let degree: number = 0; degree < 360; ++degree) {
    const c: number = Math.cos((degree * Math.PI) / 180) * radius;
    const s: number = Math.sin((degree * Math.PI) / 180) * radius;
    const strain: number = AutoMovieMotionHumanBend.strain(props, {
      x: shoulder.x + axis.x * along + u.x * c + v.x * s,
      y: shoulder.y + axis.y * along + u.y * c + v.y * s,
      z: shoulder.z + axis.z * along + u.z * c + v.z * s,
    });
    if (Number.isFinite(strain)) ++allowed;
    if (strain > solved + 1e-3) ++worse;
    if (strain < solved - 1e-6) ++beaten;
  }
  TestValidator.predicate(
    "no allowed elbow place strains less than the solved one",
    Number.isFinite(solved) && allowed > 0 && worse > 0 && beaten === 0,
  );

  TestValidator.predicate(
    "a low hand's elbow is below the shoulder",
    AutoMovieMotionHumanBend.solve({
      ...props,
      point: { x: 0.25, y: 0.95, z: 0.1 },
    }).y < shoulder.y,
  );

  const far: AutoMovieMotionHumanBend.ISolve = {
    ...props,
    point: { x: 0.8, y: 1.4, z: 0 },
  };
  TestValidator.error("a wrist past the arm's length", (): unknown =>
    AutoMovieMotionHumanBend.solve(far),
  );
  TestValidator.predicate(
    "a fallback preset answers the refusal",
    distance(
      AutoMovieMotionHumanBend.solve({ ...far, fallback: "hang" }),
      AutoMovieMotionHumanBend.arm(body, posture, "left", "hang"),
    ) === 0,
  );
}
