import {
  DEFAULT_HUMANOID_ROM,
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
  clampJointToSkeleton,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieJointPose,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanJacobian,
  type IHumanBody,
  type IHumanPosture,
  poseBones,
  resolveHumanPosture,
} from "@automovie/motions";

import { motionComplaints } from "../internal/motionComplaints";
import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * The analytic Jacobian of a posed body (`HumanJacobian`) is the derivative
 * forward kinematics has: every variable's segment twists and point
 * columns equal central differences of the posed bones.
 *
 * On a posture with every joint angle inside its range, so that no range or
 * cone clamp moves a nudged angle, each variable (the root's place and
 * heading, every joint angle the range table bounds) is nudged both ways and
 * the body posed again. Each bone's angular velocity is read from its world
 * rotation's change and its origin's linear velocity from its world
 * position's; a point riding each bone, 8 cm off its origin in the bone's
 * frame, gives a column of its point Jacobian. A central difference over a
 * thousandth of a degree, or a hundredth of a millimetre, is exact to far
 * below the bound of a micrometre (a micro-radian) per unit.
 *
 * Scenarios, on the average man and the small woman, each at a seeded
 * posture:
 * 1. Every bone's twist under every variable: its angular velocity and its
 *    origin's linear velocity.
 * 2. The point Jacobian of every bone's origin and of a bone-local point on
 *    every bone.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Poses the body through the public posture resolver and compares the module's twists and columns with the difference of real poses; a wrong axis, order, sign, pivot or carried set fails with the variable, the bone and the error.
 * @evidence contracts/development/testing.md#independent-expectations The expectation is the forward kinematics itself, differenced; nothing is read from the module under test.
 * @evidence contracts/development/testing.md#distinguishing-cases Places, heading turns and joint angles, proximal and distal twists, two bodies, origins and off-origin points.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and poses them in memory, well under a minute; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the relation, the posture, the readings, the step and bound with their reason, and the 2 scenarios.
 */
export function test_human_motion_core_jacobian(): void {
  const all: motionComplaints.IGatherer = motionComplaints();
  const LIMIT: number = 1e-6;
  const OFFSET: IAutoMovieVector3 = { x: 0.04, y: 0.06, z: -0.03 };
  for (const [name, seed] of [
    ["m-average", 7],
    ["f-small", 11],
  ] as const) {
    const body: IHumanBody = motionHumanBody(name);
    let state: number = seed;
    const random = (): number => {
      state = (state * 1103515245 + 12345) % 2147483648;
      return state / 2147483648;
    };

    // A posture inside every range, and the variables it has.
    const joints: IHumanPosture["joints"] = {};
    const variables: HumanJacobian.IVariable[] = [
      { kind: "place", axis: "x" },
      { kind: "place", axis: "y" },
      { kind: "place", axis: "z" },
      { kind: "heading", axis: "yaw" },
      { kind: "heading", axis: "pitch" },
      { kind: "heading", axis: "roll" },
    ];
    for (const bone of body.skeleton.bones.map(
      (b: IAutoMovieBone): AutoMovieHumanoidBone => b.bone,
    )) {
      const rom: (typeof DEFAULT_HUMANOID_ROM)[AutoMovieHumanoidBone] =
        DEFAULT_HUMANOID_ROM[bone];
      if (rom === undefined) continue;
      const spans: (ISpan | null | undefined)[] = [
        rom.flexion,
        rom.abduction,
        rom.twist,
      ];
      const offsets: number[] = spans.map(
        (s: ISpan | null | undefined): number =>
          s === null || s === undefined ? 0 : (random() - 0.5) * 0.6,
      );
      let shrink: number = 1;
      const at = (): [number, number, number] => {
        const value = (k: number): number => {
          const s: ISpan | null | undefined = spans[k];
          return s === null || s === undefined
            ? 0
            : (s.min + s.max) / 2 + offsets[k]! * shrink * (s.max - s.min);
        };
        return [value(0), value(1), value(2)];
      };
      const inside = (a: readonly [number, number, number]): boolean => {
        const pose: IAutoMovieJointPose = { bone, flexion: a[0], abduction: a[1], twist: a[2] };
        const clamped: IAutoMovieJointPose = clampJointToSkeleton(pose, body.skeleton);
        return (
          Math.abs((clamped.flexion ?? 0) - a[0]) < 1e-9 &&
          Math.abs((clamped.abduction ?? 0) - a[1]) < 1e-9 &&
          Math.abs((clamped.twist ?? 0) - a[2]) < 1e-9
        );
      };
      while (shrink > 1e-3 && !inside(at())) shrink /= 2;
      joints[bone] = at();
      spans.forEach((s: ISpan | null | undefined, k: number): void => {
        if (s !== null && s !== undefined)
          variables.push({ kind: "angle", bone, axis: k as 0 | 1 | 2 });
      });
    }
    const posture: IHumanPosture = {
      root: { x: random() * 2 - 1, y: 0.9 + random() * 0.2, z: random() * 2 - 1 },
      yaw: random() * 360,
      pitch: random() * 60 - 30,
      roll: random() * 40 - 20,
      joints,
      limbs: {},
    };
    const posed = (
      p: IHumanPosture,
    ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
      poseBones(body, resolveHumanPosture(body, p));
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      posed(posture);
    const motions: HumanJacobian.IMotion[] = HumanJacobian.of(
      body,
      posture,
      bones,
      variables,
    );
    const nudged = (v: HumanJacobian.IVariable, h: number): IHumanPosture => {
      if (v.kind === "place")
        return { ...posture, root: { ...posture.root, [v.axis]: posture.root[v.axis] + h } };
      if (v.kind === "heading")
        return { ...posture, [v.axis]: posture[v.axis] + h };
      const was: readonly [number, number, number] = joints[v.bone]!;
      const set: [number, number, number] = [was[0], was[1], was[2]];
      set[v.axis] += h;
      return { ...posture, joints: { ...joints, [v.bone]: set } };
    };
    const local = (b: IAutoMovieResolvedBone): IAutoMovieVector3 =>
      Vector3.add(b.worldPosition, Quaternion.rotateVector(b.worldRotation, OFFSET));
    let worst: { error: number; where: string } = { error: 0, where: "none" };
    const compare = (an: IAutoMovieVector3, fd: IAutoMovieVector3, where: string): void => {
      const error: number = Vector3.length(Vector3.subtract(an, fd));
      if (error > worst.error) worst = { error, where };
    };
    variables.forEach((v: HumanJacobian.IVariable, i: number): void => {
      const h: number = v.kind === "place" ? 1e-5 : 1e-3;
      const up: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = posed(nudged(v, h));
      const down: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = posed(nudged(v, -h));
      const label: string =
        v.kind === "angle" ? `${v.bone}.${v.axis}` : `${v.kind}.${v.axis}`;
      for (const [bone, b] of bones) {
        const a: IAutoMovieResolvedBone = up.get(bone)!;
        const c: IAutoMovieResolvedBone = down.get(bone)!;
        // Angular velocity: the turn from the lower pose to the upper.
        const turn: IAutoMovieQuaternion = Quaternion.multiply(
          a.worldRotation,
          Quaternion.inverse(c.worldRotation),
        );
        const sign: number = turn.w < 0 ? -1 : 1;
        const vector: IAutoMovieVector3 = { x: turn.x * sign, y: turn.y * sign, z: turn.z * sign };
        const sine: number = Vector3.length(vector);
        const angle: number = 2 * Math.atan2(sine, Math.abs(turn.w));
        const omega: IAutoMovieVector3 =
          sine < 1e-15 ? { x: 0, y: 0, z: 0 } : Vector3.scale(vector, angle / sine / (2 * h));
        const twist: HumanJacobian.ITwist = HumanJacobian.twist(motions[i]!, bone, b.worldPosition);
        compare(twist.angular, omega, `${label} turning ${bone}`);
        compare(
          twist.linear,
          Vector3.scale(Vector3.subtract(a.worldPosition, c.worldPosition), 1 / (2 * h)),
          `${label} moving ${bone}'s origin`,
        );
        compare(
          HumanJacobian.velocity(motions[i]!, bone, local(b)),
          Vector3.scale(Vector3.subtract(local(a), local(c)), 1 / (2 * h)),
          `${label} moving a point on ${bone}`,
        );
      }
    });
    all.check(
      `${name}: the Jacobian differs from the central difference by ${worst.error.toExponential(2)} per unit (${worst.where}), within ${LIMIT} expected, over ${variables.length} variables`,
      worst.error <= LIMIT,
    );
  }
  all.assert("the analytic Jacobian is the derivative of forward kinematics");
}

/** A joint axis's range, degrees. */
interface ISpan {
  /** The least angle. */
  min: number;

  /** The greatest angle. */
  max: number;
}
