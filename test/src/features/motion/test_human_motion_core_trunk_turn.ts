import {
  type IAutoMovieResolvedBone,
  Quaternion,
  getConstraint,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanTrunk,
  HumanTrunkTurn,
  type IHumanBody,
  type IHumanPosture,
  stand,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A trunk turned toward a side by a share of its range
 * (`HumanTrunkTurn.turned`): the spine and the chest each go the share of the
 * way to their own range's ends toward the side, and the neck and the head
 * take back what they turned, within their ranges.
 *
 * The posture is the average man's quiet stance with the spine and the chest
 * already bent 10 degrees forward, 3 to the right and twisted 4 to the right,
 * so the share is measured from a turned start.
 *
 * Scenarios:
 * 1. A share of 0 leaves the spine, the chest, the neck and the head as they
 *    were.
 * 2. A share of 1 toward the left puts the spine's and the chest's side bend
 *    at its range's minimum and their twist at its maximum (the side bend is
 *    negative and the twist positive to the left); toward the right, the
 *    other ends; the forward bend is kept.
 * 3. A share of 0.5 toward the left puts each halfway from its start to that
 *    end, and a share of -0.5 halfway to the other end.
 * 4. At a share of 0.2 the neck's and the head's side bend and twist together
 *    change by the opposite of the spine's and the chest's (within their
 *    ranges there), and at a share of 1 each lies within its range.
 * 5. Righting: at a share of 0.2 toward the left the head's world up turns
 *    less than the chest's from where they stood.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public turn on a real body's ranges and reads the joints it writes and the trunk the posture places; a wrong side, a share read from zero instead of the start, a head left to turn with the trunk or carried past its range fails with the numbers.
 * @evidence contracts/development/testing.md#independent-expectations The ends are the rig's ranges read through the engine's constraint; the halfway points and the take-back are arithmetic on them; the righting is read on the placed bones.
 * @evidence contracts/development/testing.md#distinguishing-cases Both sides, the shares 0, 0.2, 0.5, -0.5 and 1, a turned start.
 * @evidence contracts/development/testing.md#execution-ownership In memory, a few trunk placements on one prepared body; it is a real-body test; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, the posture and the 5 scenarios with their bounds.
 */
export function test_human_motion_core_trunk_turn(): void {
  const body: IHumanBody = motionHumanBody("m-average");
  const base: IHumanPosture = stand.posture(body, { x: 0, y: 0, z: 0 }, 0);
  const posture: IHumanPosture = {
    ...base,
    joints: { ...base.joints, spine: [10, 3, -4], chest: [10, 3, -4] },
  };
  const complaints: string[] = [];
  const near = (a: number, b: number): boolean => Math.abs(a - b) <= 1e-9;
  const of = (
    p: IHumanPosture,
    bone: "spine" | "chest" | "neck" | "head",
  ): readonly [number, number, number] => p.joints[bone] ?? [0, 0, 0];
  const range = (bone: AutoMovieHumanoidBone): Constraint =>
    getConstraint(
      bone,
      body.skeleton.bones.find((b: IAutoMovieBone): boolean => b.bone === bone)
        ?.constraint ?? null,
    )!;

  // 1. Nothing at a share of 0.
  const still: IHumanPosture = HumanTrunkTurn.turned(body, posture, 0, "left");
  for (const bone of ["spine", "chest", "neck", "head"] as const)
    if (JSON.stringify(of(still, bone)) !== JSON.stringify(of(posture, bone)))
      complaints.push(
        `a share of 0 changes the ${bone} from ${JSON.stringify(of(posture, bone))} to ${JSON.stringify(of(still, bone))}`,
      );

  // 2 and 3. The ends and the halfway points.
  for (const [share, side, roll, twist] of [
    [1, "left", "min", "max"],
    [1, "right", "max", "min"],
    [0.5, "left", "min", "max"],
    [-0.5, "left", "max", "min"],
  ] as const) {
    const turned: IHumanPosture = HumanTrunkTurn.turned(
      body,
      posture,
      share,
      side,
    );
    for (const bone of ["spine", "chest"] as const) {
      const limits: Constraint = range(bone);
      const start: readonly [number, number, number] = of(posture, bone);
      const fraction: number = Math.abs(share);
      const expected: [number, number, number] = [
        start[0],
        start[1] + fraction * (limits.abduction![roll] - start[1]),
        start[2] + fraction * (limits.twist![twist] - start[2]),
      ];
      const got: readonly [number, number, number] = of(turned, bone);
      if (!expected.every((v: number, i: number): boolean => near(v, got[i]!)))
        complaints.push(
          `a share of ${share} toward the ${side} puts the ${bone} at ${JSON.stringify(got)}, ${JSON.stringify(expected)} expected`,
        );
    }
  }

  // 4. The neck and the head take it back.
  const small: IHumanPosture = HumanTrunkTurn.turned(body, posture, 0.2, "left");
  for (const axis of [1, 2] as const) {
    const trunk: number =
      of(small, "spine")[axis] -
      of(posture, "spine")[axis] +
      of(small, "chest")[axis] -
      of(posture, "chest")[axis];
    const head: number =
      of(small, "neck")[axis] -
      of(posture, "neck")[axis] +
      of(small, "head")[axis] -
      of(posture, "head")[axis];
    if (!near(head, -trunk))
      complaints.push(
        `at a share of 0.2 the neck and the head turn ${head.toFixed(4)} about axis ${axis} against the trunk's ${trunk.toFixed(4)}, its opposite expected`,
      );
  }
  const whole: IHumanPosture = HumanTrunkTurn.turned(body, posture, 1, "left");
  for (const bone of ["neck", "head"] as const) {
    const limits: Constraint = range(bone);
    const got: readonly [number, number, number] = of(whole, bone);
    for (const [axis, interval] of [
      [1, limits.abduction],
      [2, limits.twist],
    ] as const)
      if (
        interval !== null &&
        interval !== undefined &&
        !(got[axis] >= interval.min - 1e-9 && got[axis] <= interval.max + 1e-9)
      )
        complaints.push(
          `at a share of 1 the ${bone} turns ${got[axis].toFixed(3)} about axis ${axis}, inside ${interval.min} to ${interval.max} expected`,
        );
  }

  // 5. The head stays more upright than the chest.
  const up = (
    bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    bone: AutoMovieHumanoidBone,
  ): IAutoMovieQuaternion => bones.get(bone)!.worldRotation;
  const before: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
    HumanTrunk.resolve(body, posture);
  const after: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
    HumanTrunk.resolve(body, small);
  const tilt = (bone: AutoMovieHumanoidBone): number => {
    const a: IAutoMovieVector3 = Quaternion.rotateVector(up(before, bone), { x: 0, y: 1, z: 0 });
    const b: IAutoMovieVector3 = Quaternion.rotateVector(up(after, bone), { x: 0, y: 1, z: 0 });
    return (
      (Math.acos(Math.min(1, a.x * b.x + a.y * b.y + a.z * b.z)) * 180) /
      Math.PI
    );
  };
  if (!(tilt("head") < tilt("chest")))
    complaints.push(
      `at a share of 0.2 the head's up turns ${tilt("head").toFixed(2)} degrees and the chest's ${tilt("chest").toFixed(2)}, less for the head expected`,
    );
  TestValidator.equals(
    "a trunk turns by a share of its range and the head rights against it",
    complaints,
    [],
  );
}

/** A joint's range on the rig. */
type Constraint = NonNullable<ReturnType<typeof getConstraint>>;
