import type { IAutoMovieResolvedBone } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanLean,
  HumanBalance,
  type IAutoMovieMotionHumanPrimitive,
  type IHumanBody,
  type IHumanPosture,
  poseBones,
  resolveHumanPosture,
  stand,
} from "@automovie/motions";

import { motionComplaints } from "../internal/motionComplaints";
import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * The leans of a standing body on real bodies: a tilt about the hips, a
 * forward tip with the hips moved back, a sway over planted feet and a bow.
 *
 * Every expectation is read on the displayed bones the resolver gives for
 * the written posture, not on the posture's own numbers. A lean about the
 * hips leaves the hips bone where it was, which a tilt about the root (on
 * the floor) would not: it would swing the hips by their height times the
 * tilt's sine, 0.3 m at 20 degrees. A performer heading +Z has the left along
 * +X; turned 90 degrees to the left the heading is +X. A bow's hip shift
 * scales with the pitch's sine, so half the peak moves the hips back by
 * `sin(peak / 2) / sin(peak)` of the peak's shift.
 *
 * Scenarios, on each of the fourteen people of the sweep:
 * 1. `pivot` adds its pitch and its roll, keeps the hips bone in place, moves
 *    the head forward for a pitch and to the right for a roll, and two pivots
 *    are one pivot of their sum; `tilt` claims the trunk, adds its angles at
 *    the second written and leaves the root where it was.
 * 2. `tip` adds its pitch and moves the hips bone back along the heading by
 *    exactly the distance asked, at a heading of 0 and of 90 degrees; a tip
 *    of nothing changes nothing.
 * 3. `sway` claims the root and the trunk over its span, asks its angles and
 *    its shift with the second written, carries the hips over the floor in
 *    the performer's frame without reading the shift's height, lowers the
 *    hips until both planted feet stay on their goals, and keeps the limbs.
 * 4. `bow` refuses a peak that is not positive; for peaks of 15, 40 and 70
 *    degrees: at weight 0 it changes nothing; at weight 1 the trunk is
 *    pitched by the peak and the centre of mass is not ahead of the middle of
 *    the soles (within 2 mm), where the same pitch without the shift leaves
 *    it more than 20 mm ahead at 40 and 70 degrees; a peak whose pitch alone
 *    stays behind the middle moves the hips nowhere, and a shifted one is not
 *    drawn behind the middle either; at half the weight the pitch is half and
 *    the hips' shift is the ratio of sines; a weight outside [0, 1] is the
 *    nearer end.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the resolver's bones for each written posture; a tilt about the root, a shift applied in the world frame, a sway that lets a foot leave its plant, a bow without its balance shift or an unclamped weight fails.
 * @evidence contracts/development/testing.md#independent-expectations The hips' place is the standing one moved by the stated distance, the feet's places are the standing goals, the bow's shift ratio is the stated ratio of sines and the balance is the centre of mass over the soles.
 * @evidence contracts/development/testing.md#distinguishing-cases Pitch against roll, two headings, a shift with and without a height, weights at, inside and outside [0, 1], refused peaks at and under 0, three bow peaks, the fourteen bodies of the sweep; every failing cell is named with its body and its measured numbers.
 * @evidence contracts/development/testing.md#execution-ownership In memory on the fourteen prepared bodies; slow because preparing a body takes seconds; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States what is read, the frame and the ratio, and lists the 4 scenarios.
 */
export function test_human_motion_compose_lean(): void {
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
  const all: motionComplaints.IGatherer = motionComplaints();

  for (const name of motionHumanBody.SWEEP) {
    const body: IHumanBody = motionHumanBody(name);
    const bones = (posture: IHumanPosture): Bones =>
      poseBones(body, resolveHumanPosture(body, posture));
    const at = (
      posture: IHumanPosture,
      bone: AutoMovieHumanoidBone,
    ): IAutoMovieVector3 => bones(posture).get(bone)!.worldPosition;
    const standing: IHumanPosture = stand.posture(
      body,
      { x: 0, y: 0, z: 0 },
      0,
    );
    const hips: IAutoMovieVector3 = at(standing, "hips");
    const head: IAutoMovieVector3 = at(standing, "head");

    // 1. A tilt about the hips.
    const pitched: IHumanPosture = AutoMovieMotionHumanLean.pivot(
      body,
      standing,
      { pitch: 20, roll: 0 },
    );
    const rolled: IHumanPosture = AutoMovieMotionHumanLean.pivot(
      body,
      standing,
      { pitch: 0, roll: 10 },
    );
    all.check(
      `${name}: a pivot adds its angles and keeps the hips in place`,
      pitched.pitch === 20 &&
        pitched.roll === 0 &&
        rolled.roll === 10 &&
        near(at(pitched, "hips"), hips) &&
        near(at(rolled, "hips"), hips),
    );
    all.check(
      `${name}: a pitch carries the head forward and a roll carries it to the right`,
      at(pitched, "head").z - head.z > 0.1 &&
        Math.abs(at(pitched, "head").x - head.x) < 1e-6 &&
        at(rolled, "head").x - head.x < -0.05 &&
        Math.abs(at(rolled, "head").z - head.z) < 1e-6,
    );
    const twice: IHumanPosture = AutoMovieMotionHumanLean.pivot(
      body,
      AutoMovieMotionHumanLean.pivot(body, standing, { pitch: 8, roll: 0 }),
      { pitch: 12, roll: 0 },
    );
    all.check(
      `${name}: two pivots are one pivot of their sum`,
      near(twice.root, pitched.root, 1e-9) && twice.pitch === 20,
    );

    const tilt: IAutoMovieMotionHumanPrimitive = AutoMovieMotionHumanLean.tilt({
      from: 1,
      to: 3,
      angles: (seconds: number): AutoMovieMotionHumanLean.IAngles => ({
        pitch: seconds,
        roll: -seconds,
      }),
    });
    const tilted: IHumanPosture = tilt.write(pitched, 2);
    all.equals(
      `${name}: a tilt claims the trunk over its span, adds its angles at the second written and leaves the root`,
      [
        tilt.channels,
        tilt.from,
        tilt.to,
        tilted.pitch,
        tilted.roll,
        tilted.root,
      ],
      [["trunk"], 1, 3, 22, -2, pitched.root],
    );

    // 2. A tip with the hips moved back.
    for (const yaw of [0, 90] as const) {
      const turned: IHumanPosture = stand.posture(
        body,
        { x: 0.3, y: 0, z: -0.2 },
        yaw,
      );
      const was: IAutoMovieVector3 = at(turned, "hips");
      const tipped: IHumanPosture = AutoMovieMotionHumanLean.tip(
        body,
        turned,
        25,
        0.08,
      );
      const moved: IAutoMovieVector3 = at(tipped, "hips");
      all.check(
        `${name}: a tip at a heading of ${yaw} moves the hips back by 80 mm and adds its pitch`,
        tipped.pitch === 25 &&
          near(moved, {
            x: was.x - (yaw === 90 ? 0.08 : 0),
            y: was.y,
            z: was.z - (yaw === 0 ? 0.08 : 0),
          }),
      );
      all.check(
        `${name}: a tip of nothing at a heading of ${yaw} changes nothing`,
        near(
          AutoMovieMotionHumanLean.tip(body, turned, 0, 0).root,
          turned.root,
          1e-9,
        ),
      );
    }

    // 3. A sway over planted feet.
    const asked: number[] = [];
    const sway: IAutoMovieMotionHumanPrimitive = AutoMovieMotionHumanLean.sway({
      body,
      from: 0.5,
      to: 2,
      angles: (seconds: number): AutoMovieMotionHumanLean.IAngles => {
        asked.push(seconds);
        return { pitch: 0, roll: -6 };
      },
      shift: (seconds: number): IAutoMovieVector3 => {
        asked.push(seconds);
        return { x: 0.15, y: 5, z: 0.02 };
      },
    });
    const swayed: IHumanPosture = sway.write(standing, 1.25);
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
    const turnedSway: IHumanPosture = AutoMovieMotionHumanLean.sway({
      body,
      from: 0,
      to: 1,
      angles: (): AutoMovieMotionHumanLean.IAngles => ({ pitch: 0, roll: 0 }),
      shift: (): IAutoMovieVector3 => ({ x: 0, y: 0, z: 0.05 }),
    }).write(stand.posture(body, { x: 0, y: 0, z: 0 }, 90), 0.5);
    all.check(
      `${name}: a sway's shift is in the performer's frame`,
      Math.abs(
        at(turnedSway, "hips").x -
          at(stand.posture(body, { x: 0, y: 0, z: 0 }, 90), "hips").x -
          0.05,
      ) <= 1e-6,
    );

    // 4. A bow.
    const bow = (
      peak: number,
      weight: number,
    ): IAutoMovieMotionHumanPrimitive =>
      AutoMovieMotionHumanLean.bow({
        body,
        standing,
        peak,
        from: 0.5,
        to: 2,
        weight: (): number => weight,
      });
    all.refuses(`${name}: a bow of no pitch is refused`, (): void => {
      bow(0, 1);
    });
    all.refuses(`${name}: a backward bow is refused`, (): void => {
      bow(-10, 1);
    });
    all.equals(
      `${name}: a bow claims the root and the trunk over its span`,
      [bow(40, 1).channels, bow(40, 1).from, bow(40, 1).to],
      [["root", "trunk"], 0.5, 2],
    );
    const back = (posture: IHumanPosture): number =>
      hips.z - at(posture, "hips").z;
    for (const peak of [15, 40, 70] as const) {
      const full: IHumanPosture = bow(peak, 1).write(standing, 1);
      const half: IHumanPosture = bow(peak, 0.5).write(standing, 1);
      const none: IHumanPosture = bow(peak, 0).write(standing, 1);
      const bare: number = HumanBalance.offset(
        body,
        AutoMovieMotionHumanLean.tip(body, standing, peak, 0),
      );
      const held: number = HumanBalance.offset(body, full);
      all.check(
        `${name}: a bow of ${peak} at weight 0 changes nothing`,
        none.pitch === 0 && near(at(none, "hips"), hips, 1e-9),
      );
      all.check(
        `${name}: a bow of ${peak} holds the centre of mass over the soles, ${(held * 1000).toFixed(1)} mm ahead against ${(bare * 1000).toFixed(1)} mm without its shift`,
        full.pitch === peak &&
          held <= 0.002 &&
          held <= bare + 1e-9 &&
          (bare <= 0.002 ? Math.abs(held - bare) <= 1e-9 : held >= -0.002) &&
          (peak === 15 || bare > 0.02),
      );
      all.check(
        `${name}: half a bow of ${peak} moves the hips back by the ratio of sines, ${(back(half) * 1000).toFixed(1)} mm of ${(back(full) * 1000).toFixed(1)} mm`,
        half.pitch === peak / 2 &&
          Math.abs(back(half) - (back(full) * sine(peak / 2)) / sine(peak)) <=
            1e-6,
      );
      all.check(
        `${name}: a bow of ${peak}'s weight outside [0, 1] is the nearer end`,
        near(
          at(bow(peak, 2).write(standing, 1), "hips"),
          at(full, "hips"),
          1e-9,
        ) && near(at(bow(peak, -1).write(standing, 1), "hips"), hips, 1e-9),
      );
    }
  }
  all.assert("the leans hold on every body");
}
