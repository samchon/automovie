import { getConstraint } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";
import { HumanTrunkTurn } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../internal/fixtures/humanFixtureBody";
import { nclose } from "../../internal/nclose";

/** Rounding of a few products of degrees. */
const ROUNDING: number = 1e-9;

/** The trunk's turning joints, and the head's righting ones. */
const TRUNK: readonly AutoMovieHumanoidBone[] = ["spine", "chest"];
const HEAD: readonly AutoMovieHumanoidBone[] = ["neck", "head"];

/** A joint's ranges. */
type Range = NonNullable<ReturnType<typeof getConstraint>>;

/**
 * `HumanTrunkTurn.turned` turns the trunk toward a side by a share of its
 * range: the spine and the chest each bend to the side (abduction toward its
 * minimum for the left) and twist toward it (twist toward its maximum for the
 * left) by that share of the way from the present angle to the range's end, and
 * the neck and the head each take back half of what the two turned, clamped to
 * their own ranges; a negative share turns the other way, toward the other
 * ends.
 *
 * The body is built whole (`humanFixtureBody`) for its joint ranges. The
 * average man stands upright, his chest bent 5 degrees and twisted 3.
 *
 * Scenarios:
 *
 * 1. A share of 0.4 to the left moves the spine and the chest 0.4 of the way to
 *    their left ends; the neck and the head take back half the total each,
 *    within their ranges; flexion and every other joint stay.
 * 2. To the right the spine and chest move toward the other ends.
 * 3. A share of −0.4 to the left is a share of 0.4 to the right.
 * 4. A share of zero changes nothing.
 */
export async function test_motions_posture_trunk_turn(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const range = (
    bone: AutoMovieHumanoidBone,
  ): ReturnType<typeof getConstraint> =>
    getConstraint(
      bone,
      body.skeleton.bones.find((b: IAutoMovieBone): boolean => b.bone === bone)
        ?.constraint ?? null,
    );
  const upright: IAutoMovieMotionHumanPosture = {
    root: { x: 0, y: 0.9, z: 0 },
    yaw: 0,
    pitch: 0,
    roll: 0,
    joints: { chest: [2, 5, 3], leftUpperArm: [10, 0, 0] },
    limbs: {},
  };
  const expected = (share: number, toLeft: number): number[][] => {
    let roll: number = 0;
    let twist: number = 0;
    const out: number[][] = [];
    for (const bone of TRUNK) {
      const was: readonly [number, number, number] = upright.joints[bone] ?? [
        0, 0, 0,
      ];
      const r: Range = range(bone)!;
      const to = (
        v: number,
        lim: { min: number; max: number },
        sign: number,
      ): number =>
        v + Math.abs(share) * ((sign * share > 0 ? lim.max : lim.min) - v);
      const next: number[] = [
        was[0],
        to(was[1], r.abduction!, -toLeft),
        to(was[2], r.twist!, toLeft),
      ];
      roll += next[1]! - was[1];
      twist += next[2]! - was[2];
      out.push(next);
    }
    for (const bone of HEAD) {
      const r: Range = range(bone)!;
      const clamp = (v: number, lim: { min: number; max: number }): number =>
        Math.min(lim.max, Math.max(lim.min, v));
      out.push([
        0,
        clamp(-roll / 2, r.abduction!),
        clamp(-twist / 2, r.twist!),
      ]);
    }
    return out;
  };
  const read = (posture: IAutoMovieMotionHumanPosture): number[][] =>
    [...TRUNK, ...HEAD].map((bone: AutoMovieHumanoidBone): number[] => [
      ...(posture.joints[bone] ?? [0, 0, 0]),
    ]);
  const agree = (a: number[][], b: number[][]): boolean =>
    a.every((row: number[], i: number): boolean =>
      row.every((v: number, j: number): boolean =>
        nclose(v, b[i]![j]!, ROUNDING),
      ),
    );

  // 1. Left.
  const left: IAutoMovieMotionHumanPosture = HumanTrunkTurn.turned(
    body,
    upright,
    0.4,
    "left",
  );
  TestValidator.predicate(
    "the trunk a share toward the left, the head righted",
    agree(read(left), expected(0.4, 1)) &&
      left.joints.leftUpperArm === upright.joints.leftUpperArm &&
      left.joints.chest![0] === 2,
  );

  // 2. Right.
  TestValidator.predicate(
    "the trunk toward the right",
    agree(
      read(HumanTrunkTurn.turned(body, upright, 0.4, "right")),
      expected(0.4, -1),
    ),
  );

  // 3. A negative share.
  TestValidator.predicate(
    "a negative share turns the other way",
    agree(
      read(HumanTrunkTurn.turned(body, upright, -0.4, "left")),
      read(HumanTrunkTurn.turned(body, upright, 0.4, "right")),
    ),
  );

  // 4. No share.
  TestValidator.predicate(
    "no share, no turn",
    agree(read(HumanTrunkTurn.turned(body, upright, 0, "left")), read(upright)),
  );
}
