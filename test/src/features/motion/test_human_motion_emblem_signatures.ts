import { Vector3, resolveAutoMovieHumanoidSurfaces } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanSegment,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanTouchEffector,
  HumanChain,
  HumanEmblem,
  HumanHabit,
  HumanPerformance,
  touch,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

type Bones = ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;

interface IHold {
  label: string;
  body: IAutoMovieMotionHumanBody;
  bones: Bones;
  stood: () => Bones;
}

/**
 * The emblems and habits of the lexicon show the form their names mean,
 * each read at the middle of its hold on displayed joints (#3345, #3346).
 *
 * One witness per contact or framing branch, staged on the corresponding
 * small, average or large body:
 * 1. `hush`: the forefinger stands across the lips. Its middle joint lies
 *    within 20 mm of the mouth region and the finger, from its knuckle to
 *    its last joint, within 15 degrees of upright (both provisional: NTU
 *    RGB+D 120 names the act, A67, and no measured form was read).
 * 2. `blownKiss`: the forefinger's pad lies within 15 mm of the mouth
 *    region through the hold (#3345: the hand surface reaches its region
 *    within 15 mm).
 * 3. `handOnHeart`: the right palm lies within 15 mm of the left chest
 *    region (#3345: the hand surface reaches its region within 15 mm).
 * 4. `checkWatch`: the left wrist is held 0.30 to 0.40 m from the eyes
 *    (#3345's reading distance, provisional there; the law holds it at the
 *    0.362 m of Bababekova et al. 2011), in front of the trunk, and the head
 *    is pitched at least 10 degrees further down than in quiet standing
 *    (provisional).
 *
 * @evidence contracts/development/testing.md#behavioral-verification Registers the lexicon's rows, performs each on real bodies and reads displayed joints and regions; a finger laid flat, a hand short of its place, a watch held at the waist or a head left level fails.
 * @evidence contracts/development/testing.md#independent-expectations Each form is what the emblem means and each bound is the issue's acceptance or marked provisional; none is read from the law's output.
 * @evidence contracts/development/testing.md#distinguishing-cases Four rows over two laws and three hand attitudes, on three bodies of different stature and build.
 * @evidence contracts/development/testing.md#execution-ownership Prepares three rigs and builds four short one-person performances; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and the 4 scenarios with their bounds and sources.
 */
export function test_human_motion_emblem_signatures(): void {
  const laws: IAutoMovieMotionHumanActionLaw<never>[] = [
    HumanEmblem.hush,
    HumanEmblem.blownKiss,
    HumanEmblem.handOnHeart,
    HumanHabit.checkWatch,
  ];
  const complaints: string[] = [];
  const mm = (metres: number): string => (metres * 1000).toFixed(0);
  const read = (
    row: string,
    name: motionHumanBody.Name,
    check: (hold: IHold) => void,
  ): void => {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    const label: string = `${name}: ${row}`;
    try {
      const performance: IAutoMovieMotionHumanPerformance =
        new HumanPerformance({
          seed: "emblem",
          laws,
          performers: [
            {
              subject: "a",
              body,
              at: { x: 0, y: 0, z: 0 },
              yaw: 0,
              proficiency: { level: "trained" },
            },
          ],
          composition: HumanChain.subject("a")
            .stand({ seconds: 0.3 })
            .registered(row, {}).node,
        });
      const placed: IAutoMovieMotionHumanSegment =
        performance.segments("a")[1]!;
      const instant = (name: string): number =>
        placed.start +
        (placed.plan.events.find((event): boolean => event.name === name)
          ?.share ?? NaN) *
          placed.plan.duration;
      check({
        body,
        label,
        bones: performance.bones(
          "a",
          (instant("strokeEnd") + instant("relax")) / 2,
        ),
        stood: (): Bones => performance.bones("a", placed.start),
      });
    } catch (error) {
      complaints.push(`${label}: expected to plan, got ${String(error)}`);
    }
  };
  const joint = (
    bones: Bones,
    bone: AutoMovieHumanoidBone,
  ): IAutoMovieVector3 => bones.get(bone)!.worldPosition;
  const surface = (
    held: IHold,
    region: AutoMovieHumanoidRegion,
  ): IAutoMovieVector3 => {
    const frame = held.body.surfaces.regions[region];
    return resolveAutoMovieHumanoidSurfaces.place(
      frame,
      held.bones.get(frame.bone)!,
    ).point;
  };

  read("hush", "m-average", (held: IHold): void => {
    const off: number = Vector3.distance(
      joint(held.bones, "rightIndexIntermediate"),
      surface(held, "mouth"),
    );
    if (!(off <= 0.02))
      complaints.push(
        `${held.label}: the forefinger's middle joint is ${mm(off)} mm from the mouth, within 20 mm expected`,
      );
    const line: IAutoMovieVector3 = Vector3.subtract(
      joint(held.bones, "rightIndexDistal"),
      joint(held.bones, "rightIndexProximal"),
    );
    const lean: number =
      (Math.acos(line.y / Vector3.length(line)) * 180) / Math.PI;
    if (!(lean <= 15))
      complaints.push(
        `${held.label}: the forefinger stands ${lean.toFixed(1)} degrees off upright, within 15 expected`,
      );
  });

  read("blownKiss", "f-small", (held: IHold): void => {
    const off: number = Vector3.distance(
      AutoMovieMotionHumanTouchEffector.point(
        held.body,
        held.bones,
        "right",
        touch.EFFECTORS.fingertips,
      ),
      surface(held, "mouth"),
    );
    if (!(off <= 0.015))
      complaints.push(
        `${held.label}: the forefinger's pad is ${mm(off)} mm from the mouth, within 15 mm expected`,
      );
  });

  read("handOnHeart", "m-large", (held: IHold): void => {
    const off: number = Vector3.distance(
      AutoMovieMotionHumanTouchEffector.point(
        held.body,
        held.bones,
        "right",
        touch.EFFECTORS.palm,
      ),
      surface(held, "chestLeft"),
    );
    if (!(off <= 0.015))
      complaints.push(
        `${held.label}: the palm is ${mm(off)} mm from the left chest, within 15 mm expected`,
      );
  });

  read("checkWatch", "f-small", (held: IHold): void => {
    const eyes = (bones: Bones): IAutoMovieVector3 =>
      Vector3.scale(
        Vector3.add(joint(bones, "leftEye"), joint(bones, "rightEye")),
        0.5,
      );
    const wrist: IAutoMovieVector3 = joint(held.bones, "leftHand");
    const midpoint: IAutoMovieVector3 = eyes(held.bones);
    const far: number = Vector3.distance(wrist, midpoint);
    if (!(far >= 0.3 && far <= 0.4))
      complaints.push(
        `${held.label}: the watch wrist is ${mm(far)} mm from the eyes, 300 to 400 mm expected`,
      );
    if (!(wrist.z > joint(held.bones, "chest").z))
      complaints.push(`${held.label}: the watch wrist does not pass the chest`);

    const pitch = (bones: Bones, at: IAutoMovieVector3): number => {
      const axis: IAutoMovieVector3 = Vector3.subtract(
        at,
        joint(bones, "head"),
      );
      return (Math.atan2(-axis.y, Math.hypot(axis.x, axis.z)) * 180) / Math.PI;
    };
    const stood: Bones = held.stood();
    const bowed: number =
      pitch(held.bones, midpoint) - pitch(stood, eyes(stood));
    if (!(bowed >= 10))
      complaints.push(
        `${held.label}: the head pitches ${bowed.toFixed(1)} degrees down from quiet standing, at least 10 expected`,
      );
  });

  TestValidator.equals("emblems and habits show their form", complaints, []);
}
