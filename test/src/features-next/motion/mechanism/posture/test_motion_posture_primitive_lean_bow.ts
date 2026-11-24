import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBalance,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import { AutoMovieMotionHumanStance } from "@automovie/motions";
import {
  AutoMovieMotionHumanLean,
  HumanBalance,
  poseBones,
  resolveHumanPosture,
} from "@automovie/motions/internal";

import { motionComplaints } from "../../../../features/internal/motionComplaints";
import { motionComposeTrunk } from "../../../../features/internal/motionComposeTrunk";
import { motionHumanBody } from "../../../../features/internal/motionHumanBody";

/**
 * A bow pivots at the hips, and its optional balance correction scales with the sine of the imposed pitch.
 *
 * Scenarios:
 * 1. Observe the geometry at the prescribed angle on a measured standing actor.
 * 2. Check the independent support or pivot relation through resolved joints.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the measured relationship and reference frame.
 * @evidence contracts/development/testing.md#behavioral-verification Evaluates the public primitive and measures the displayed bones.
 * @evidence contracts/development/testing.md#independent-expectations A bow pivots at the hips, and its optional balance correction scales with the sine of the imposed pitch.
 * @evidence contracts/development/testing.md#distinguishing-cases The test checks the held geometry as well as the displaced geometry.
 * @evidence contracts/development/testing.md#execution-ownership One measured actor supplies the lengths for this isolated primitive.
 */
export function test_motion_posture_primitive_lean_bow(): void {
  const name: motionHumanBody.Name = "m-average";
  const all: motionComplaints.IGatherer = motionComplaints();
  type Bones = Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;
  const near = (
    a: IAutoMovieVector3,
    b: IAutoMovieVector3,
    e: number = 1e-6,
  ): boolean =>
    Math.abs(a.x - b.x) <= e &&
    Math.abs(a.y - b.y) <= e &&
    Math.abs(a.z - b.z) <= e;
  const sine = (degrees: number): number => Math.sin((degrees * Math.PI) / 180);

  {
    const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
    const bones = (posture: IAutoMovieMotionHumanPosture): Bones =>
      poseBones(body, resolveHumanPosture(body, posture));
    const at = (
      posture: IAutoMovieMotionHumanPosture,
      bone: AutoMovieHumanoidBone,
    ): IAutoMovieVector3 => bones(posture).get(bone)!.worldPosition;
    const standing: IAutoMovieMotionHumanPosture =
      AutoMovieMotionHumanStance.stand.posture(body, { x: 0, y: 0, z: 0 }, 0);
    const hips: IAutoMovieVector3 = at(standing, "hips");
    // 4. A bow.
    const bow = (
      peak: number,
      balance?: IAutoMovieMotionHumanBalance,
      rig: IAutoMovieMotionHumanBody = body,
    ): IAutoMovieMotionHumanPrimitive =>
      AutoMovieMotionHumanLean.bow({
        body: rig,
        standing,
        peak,
        from: 0.5,
        to: 2,
        weight: (weight: number): number => weight,
        balance,
      });
    all.refuses(`${name}: a bow of no pitch is refused`, (): void => {
      bow(0);
    });
    all.refuses(`${name}: a backward bow is refused`, (): void => {
      bow(-10);
    });
    const bareBow: IAutoMovieMotionHumanPrimitive = bow(
      40,
      undefined,
      motionComposeTrunk.withoutMass(body),
    );
    all.equals(
      `${name}: a bow claims the root and the trunk over its span`,
      [bareBow.channels, bareBow.from, bareBow.to],
      [["root", "trunk"], 0.5, 2],
    );
    const back = (posture: IAutoMovieMotionHumanPosture): number =>
      hips.z - at(posture, "hips").z;
    const barePitch: IAutoMovieMotionHumanPosture = bareBow.write(standing, 1);
    all.check(
      `${name}: an unbalanced bow pitches without shifting the hips`,
      barePitch.pitch === 40 && near(at(barePitch, "hips"), hips, 1e-9),
    );
    for (const peak of [15, 40, 70] as const) {
      const phrase: IAutoMovieMotionHumanPrimitive = bow(
        peak,
        motionComposeTrunk.BALANCE,
      );
      const full: IAutoMovieMotionHumanPosture = phrase.write(standing, 1);
      const half: IAutoMovieMotionHumanPosture = phrase.write(standing, 0.5);
      const none: IAutoMovieMotionHumanPosture = phrase.write(standing, 0);
      const shifted: number = back(full);
      function margin(shift: number): number {
        return HumanBalance.margin(
          body,
          AutoMovieMotionHumanLean.tip(body, standing, peak, shift),
        );
      }
      all.check(
        `${name}: a bow of ${peak} at weight 0 changes nothing`,
        none.pitch === 0 && near(at(none, "hips"), hips, 1e-9),
      );
      all.check(
        `${name}: bow of ${peak} reaches its peak`,
        full.pitch === peak,
      );
      motionComposeTrunk.minimumSupportShift(
        all,
        `${name}: bow of ${peak}`,
        margin(0),
        HumanBalance.margin(body, full),
        shifted,
        margin,
      );
      all.check(
        `${name}: half a bow of ${peak} moves the hips back by the ratio of sines, ${(back(half) * 1000).toFixed(1)} mm of ${(back(full) * 1000).toFixed(1)} mm`,
        half.pitch === peak / 2 &&
          Math.abs(back(half) - (back(full) * sine(peak / 2)) / sine(peak)) <=
            1e-6,
      );
      all.check(
        `${name}: a bow of ${peak}'s weight outside [0, 1] is the nearer end`,
        near(at(phrase.write(standing, 2), "hips"), at(full, "hips"), 1e-9) &&
          near(at(phrase.write(standing, -1), "hips"), hips, 1e-9),
      );
    }
  }
  all.assert("bow on a standing support");
}
