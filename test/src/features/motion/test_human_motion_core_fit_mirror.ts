import type {
  AutoMovieHumanoidBone,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  type IHumanPosture,
  poseBones,
  resolveHumanPosture,
  stand,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A posture mirrored in the median plane resolves to the mirror image of
 * the original's bones, to the bit: the limb fit solves a left limb as the
 * right limb in the mirror image of its world, so no left act reads a body
 * its right twin would not see mirrored.
 *
 * The mirror of a posture is written here: the root's lateral place and the
 * heading's yaw and roll negated, each side's joints and limbs exchanged, a
 * midline joint's lateral bend and twist negated, and every limb goal's
 * points, contact and rotation mirrored.
 *
 * Scenarios, on the four extreme bodies:
 * 1. A quiet stance, its legs planted on their goals: every bone's world
 *    position and rotation is the mirror of its twin's, compared with `===`
 *    (a rotation and its negation are one rotation).
 * 2. A stance with the left arm reaching forward and across with the hand
 *    turned and a contact on the palm, the right arm hanging: the same.
 * 3. Both hands reaching forward apart, two arms with goals that keep clear
 *    of each other: the same.
 * 4. The forearms crossed before the chest, each hand toward the other
 *    shoulder, two arms whose fits meet and are solved together: the same.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Resolves real postures through the public resolver and reads the world bones every law and audit reads; a side fitted on its own fails with the bone and the component that differ.
 * @evidence contracts/development/testing.md#independent-expectations The mirror is the median-plane reflection written in this file; nothing is read from the resolver's own mirror.
 * @evidence contracts/development/testing.md#distinguishing-cases Planted legs alone, an arm with a rotation and a contact, two arms apart and two arms crossed, on the extreme bodies of both sexes.
 * @evidence contracts/development/testing.md#execution-ownership Prepares four polygon men and resolves sixteen postures in memory; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the claim, the mirror and the 4 scenarios.
 */
export function test_human_motion_core_fit_mirror(): void {
  const complaints: string[] = [];
  const flip = (v: IAutoMovieVector3): IAutoMovieVector3 => ({
    x: -v.x,
    y: v.y,
    z: v.z,
  });
  const turn = (q: IAutoMovieQuaternion): IAutoMovieQuaternion => ({
    x: q.x,
    y: -q.y,
    z: -q.z,
    w: q.w,
  });
  const swap = (name: string): string =>
    name.startsWith("left")
      ? `right${name.slice(4)}`
      : name.startsWith("right")
        ? `left${name.slice(5)}`
        : name;
  const mirror = (p: IHumanPosture): IHumanPosture => {
    const joints: Record<string, readonly [number, number, number]> = {};
    for (const [bone, v] of Object.entries(p.joints ?? {}) as [
      string,
      readonly [number, number, number],
    ][])
      joints[swap(bone)] = swap(bone) === bone ? [v[0], -v[1], -v[2]] : v;
    const limbs: Record<string, IHumanPosture.IGoal> = {};
    for (const [limb, g] of Object.entries(p.limbs ?? {}) as [
      string,
      IHumanPosture.IGoal,
    ][])
      limbs[swap(limb)] = {
        ...g,
        point: flip(g.point),
        bend: flip(g.bend),
        ...(g.rotation === undefined ? {} : { rotation: turn(g.rotation) }),
        ...(g.contact === undefined ? {} : { contact: flip(g.contact) }),
      };
    return {
      ...p,
      root: flip(p.root),
      yaw: -p.yaw,
      roll: -p.roll,
      joints,
      limbs,
    } as IHumanPosture;
  };
  const compare = (
    label: string,
    body: ReturnType<typeof motionHumanBody>,
    p: IHumanPosture,
  ): void => {
    const a = poseBones(body, resolveHumanPosture(body, p));
    const b = poseBones(body, resolveHumanPosture(body, mirror(p)));
    for (const [bone, x] of a) {
      const y = b.get(swap(bone) as AutoMovieHumanoidBone);
      if (y === undefined) continue;
      const p0: IAutoMovieVector3 = x.worldPosition;
      const p1: IAutoMovieVector3 = flip(y.worldPosition);
      if (!(p0.x === p1.x && p0.y === p1.y && p0.z === p1.z))
        complaints.push(
          `${label} ${bone}: at (${p0.x}, ${p0.y}, ${p0.z}), its twin's mirror (${p1.x}, ${p1.y}, ${p1.z})`,
        );
      const q0: IAutoMovieQuaternion = x.worldRotation;
      const q1: IAutoMovieQuaternion = turn(y.worldRotation);
      const same: boolean =
        q0.x === q1.x && q0.y === q1.y && q0.z === q1.z && q0.w === q1.w;
      const negated: boolean =
        q0.x === -q1.x && q0.y === -q1.y && q0.z === -q1.z && q0.w === -q1.w;
      if (!same && !negated)
        complaints.push(
          `${label} ${bone}: turned (${q0.x}, ${q0.y}, ${q0.z}, ${q0.w}), its twin's mirror (${q1.x}, ${q1.y}, ${q1.z}, ${q1.w})`,
        );
    }
  };
  for (const name of motionHumanBody.EXTREMES) {
    const body = motionHumanBody(name);
    const quiet: IHumanPosture = stand.posture(
      body,
      { x: 0.13, y: 0, z: -0.21 },
      17,
    );

    // 1. The quiet stance.
    compare(`${name} quiet`, body, quiet);

    // 2. The left hand reaching forward and across, turned, a contact on the palm.
    const reach: number = body.measure.upperArm + body.measure.forearm;
    compare(`${name} reaching`, body, {
      ...quiet,
      limbs: {
        ...quiet.limbs,
        leftArm: {
          point: {
            x: quiet.root.x - 0.1 * reach,
            y: body.measure.shoulderHeight - 0.15,
            z: quiet.root.z + 0.7 * reach,
          },
          bend: {
            x: quiet.root.x + 0.5,
            y: body.measure.shoulderHeight - 0.4,
            z: quiet.root.z + 0.2,
          },
          rotation: { x: 0.2588190451025208, y: 0.3, z: -0.1, w: 0.9126 },
          contact: { x: 0.01, y: -0.03, z: 0.08 },
        },
      },
    });

    // 3. Both hands reaching forward, apart, the right a little higher.
    const level: IHumanPosture = stand.posture(body, { x: 0, y: 0, z: 0 }, 0);
    const chest: number = body.measure.shoulderHeight - 0.2;
    const hand = (
      x: number,
      y: number,
      z: number,
      out: number,
    ): IHumanPosture.IGoal => ({
      point: { x, y, z },
      bend: { x: out, y: chest - 0.25, z: 0 },
    });
    compare(`${name} both reaching`, body, {
      ...level,
      limbs: {
        ...level.limbs,
        leftArm: hand(0.25, chest, 0.5 * reach, 0.5),
        rightArm: hand(-0.22, chest + 0.04, 0.55 * reach, -0.5),
      },
    });

    // 4. The forearms crossed before the chest, each hand toward the other
    //    shoulder, the left wrist a little nearer the body.
    compare(`${name} crossed`, body, {
      ...level,
      limbs: {
        ...level.limbs,
        leftArm: hand(-0.12, chest, 0.2, 0.45),
        rightArm: hand(0.1, chest + 0.02, 0.24, -0.45),
      },
    });
  }
  TestValidator.equals(
    "a mirrored posture resolves to the mirror of its bones",
    complaints.slice(0, 20),
    [],
  );
}
