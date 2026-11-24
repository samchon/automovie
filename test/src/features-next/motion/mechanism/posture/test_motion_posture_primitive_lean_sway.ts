import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanLean,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import { AutoMovieMotionHumanStance } from "@automovie/motions";
import {
  AutoMovieMotionHumanLean,
  poseBones,
  resolveHumanPosture,
} from "@automovie/motions/internal";

import { motionComplaints } from "../../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../../features/internal/motionHumanBody";

/**
 * The given floor-frame displacement moves the hips while both planted ankles retain their world locations.
 *
 * Scenarios:
 * 1. Observe the geometry at the prescribed angle on a measured standing actor.
 * 2. Check the independent support or pivot relation through resolved joints.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the measured relationship and reference frame.
 * @evidence contracts/development/testing.md#behavioral-verification Evaluates the public primitive and measures the displayed bones.
 * @evidence contracts/development/testing.md#independent-expectations The given floor-frame displacement moves the hips while both planted ankles retain their world locations.
 * @evidence contracts/development/testing.md#distinguishing-cases The test checks the held geometry as well as the displaced geometry.
 * @evidence contracts/development/testing.md#execution-ownership One measured actor supplies the lengths for this isolated primitive.
 */
export function test_motion_posture_primitive_lean_sway(): void {
  const name: motionHumanBody.Name = "m-average";
  const all: motionComplaints.IGatherer = motionComplaints();
  type Bones = Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;

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
    // 3. A sway over planted feet.
    const asked: number[] = [];
    const sway: IAutoMovieMotionHumanPrimitive = AutoMovieMotionHumanLean.sway({
      body,
      from: 0.5,
      to: 2,
      angles: (seconds: number): IAutoMovieMotionHumanLean.IAngles => {
        asked.push(seconds);
        return { pitch: 0, roll: -6 };
      },
      shift: (seconds: number): IAutoMovieVector3 => {
        asked.push(seconds);
        return { x: 0.15, y: 5, z: 0.02 };
      },
    });
    const swayed: IAutoMovieMotionHumanPosture = sway.write(standing, 1.25);
    const after: Bones = bones(swayed);
    const before: Bones = bones(standing);
    const drop: number = hips.y - after.get("hips")!.worldPosition.y;
    all.equals(
      `${name}: a sway claims the root and the trunk over its span`,
      [sway.channels, sway.from, sway.to],
      [["root", "trunk"], 0.5, 2],
    );
    all.check(
      `${name}: a sway asks its angles and its shift with the second written`,
      asked.length === 2 && asked.every((s: number): boolean => s === 1.25),
    );
    all.check(
      `${name}: a sway carries the hips 150 mm left and 20 mm ahead and lowers them, by ${(drop * 1000).toFixed(1)} mm`,
      swayed.roll === -6 &&
        Math.abs(after.get("hips")!.worldPosition.x - hips.x - 0.15) <= 1e-6 &&
        Math.abs(after.get("hips")!.worldPosition.z - hips.z - 0.02) <= 1e-6 &&
        drop > 0.001 &&
        drop < 0.2,
    );
    const slip: number = Math.max(
      ...(["leftFoot", "rightFoot"] as const).map((bone): number => {
        const a: IAutoMovieVector3 = after.get(bone)!.worldPosition;
        const b: IAutoMovieVector3 = before.get(bone)!.worldPosition;
        return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
      }),
    );
    all.check(
      `${name}: a swayed body keeps both feet on their plants, off by ${(slip * 1000).toFixed(2)} mm`,
      slip <= 0.001,
    );
    all.equals(
      `${name}: a sway keeps the limb goals and the joints it was given`,
      [swayed.limbs, swayed.joints],
      [standing.limbs, standing.joints],
    );
    const turnedSway: IAutoMovieMotionHumanPosture =
      AutoMovieMotionHumanLean.sway({
        body,
        from: 0,
        to: 1,
        angles: (): IAutoMovieMotionHumanLean.IAngles => ({
          pitch: 0,
          roll: 0,
        }),
        shift: (): IAutoMovieVector3 => ({ x: 0, y: 0, z: 0.05 }),
      }).write(
        AutoMovieMotionHumanStance.stand.posture(
          body,
          { x: 0, y: 0, z: 0 },
          90,
        ),
        0.5,
      );
    all.check(
      `${name}: a sway's shift is in the performer's frame`,
      Math.abs(
        at(turnedSway, "hips").x -
          at(
            AutoMovieMotionHumanStance.stand.posture(
              body,
              { x: 0, y: 0, z: 0 },
              90,
            ),
            "hips",
          ).x -
          0.05,
      ) <= 1e-6,
    );
  }
  all.assert("sway on a standing support");
}
