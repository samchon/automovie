import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  AutoMovieMotionHumanTouchEffector,
  HumanChain,
  HumanEmblem,
  HumanHabit,
  HumanPerformance,
  type HumanSegment,
  HumanSignature,
  type IHumanActionLaw,
  type IHumanBody,
  touch,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * The emblems and habits of the lexicon show the form their names mean,
 * each read at the middle of its hold on displayed joints (#3345, #3346).
 *
 * Scenarios, on the small woman, the average man and the large man:
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
 * @evidence contracts/development/testing.md#execution-ownership Prepares three polygon men and builds twelve short one-person performances; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and the 4 scenarios with their bounds and sources.
 */
export function test_human_motion_emblem_signatures(): void {
  const laws: IHumanActionLaw<never>[] = [
    HumanEmblem.hush,
    HumanEmblem.blownKiss,
    HumanEmblem.handOnHeart,
    HumanHabit.checkWatch,
  ];
  const complaints: string[] = [];
  const gap = (p: IAutoMovieVector3, q: IAutoMovieVector3): number =>
    Math.hypot(p.x - q.x, p.y - q.y, p.z - q.z);
  const mm = (metres: number): string => (metres * 1000).toFixed(0);
  for (const name of ["f-small", "m-average", "m-large"] as const) {
    const body: IHumanBody = motionHumanBody(name);
    const read = (
      row: string,
      check: (
        performance: HumanPerformance,
        reader: HumanSignature.IReader,
        held: number,
        start: number,
      ) => void,
    ): void => {
      try {
        const performance: HumanPerformance = new HumanPerformance({
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
        const placed: HumanSegment.ISegment = performance.segments("a")[1]!;
        const instant = (event: string): number =>
          placed.start +
          (placed.plan.events.find((e): boolean => e.name === event)?.share ??
            NaN) *
            placed.plan.duration;
        check(
          performance,
          HumanSignature.of(performance, "a", body, 0),
          (instant("strokeEnd") + instant("relax")) / 2,
          placed.start,
        );
      } catch (error) {
        complaints.push(
          `${name}: ${row}: expected to plan, got ${(error as Error).message}`,
        );
      }
    };

    // 1. The forefinger upright across the lips.
    read("hush", (
      _performance: HumanPerformance,
      reader: HumanSignature.IReader,
      held: number,
      _start: number,
    ): void => {
      const off: number = gap(
        HumanSignature.joint(reader, held, "rightIndexIntermediate"),
        HumanSignature.region(reader, "mouth", held),
      );
      if (!(off <= 0.02))
        complaints.push(
          `${name}: hush: the forefinger's middle joint is ${mm(off)} mm from the mouth, within 20 mm expected`,
        );
      const knuckle: IAutoMovieVector3 = HumanSignature.joint(
        reader,
        held,
        "rightIndexProximal",
      );
      const tip: IAutoMovieVector3 = HumanSignature.joint(
        reader,
        held,
        "rightIndexDistal",
      );
      const lean: number =
        (Math.acos((tip.y - knuckle.y) / gap(tip, knuckle)) * 180) / Math.PI;
      if (!(lean <= 15))
        complaints.push(
          `${name}: hush: the forefinger stands ${lean.toFixed(1)} degrees off upright, within 15 expected`,
        );
    });

    // 2. The fingertips at the lips.
    read("blownKiss", (
      performance: HumanPerformance,
      reader: HumanSignature.IReader,
      held: number,
      _start: number,
    ): void => {
      const off: number = gap(
        AutoMovieMotionHumanTouchEffector.point(
          body,
          performance.bones("a", held),
          "right",
          touch.EFFECTORS.fingertips,
        ),
        HumanSignature.region(reader, "mouth", held),
      );
      if (!(off <= 0.015))
        complaints.push(
          `${name}: blownKiss: the forefinger's pad is ${mm(off)} mm from the mouth, within 15 mm expected`,
        );
    });

    // 3. The palm on the heart.
    read("handOnHeart", (
      performance: HumanPerformance,
      reader: HumanSignature.IReader,
      held: number,
      _start: number,
    ): void => {
      const off: number = gap(
        AutoMovieMotionHumanTouchEffector.point(
          body,
          performance.bones("a", held),
          "right",
          touch.EFFECTORS.palm,
        ),
        HumanSignature.region(reader, "chestLeft", held),
      );
      if (!(off <= 0.015))
        complaints.push(
          `${name}: handOnHeart: the palm is ${mm(off)} mm from the left chest, within 15 mm expected`,
        );
    });

    // 4. The watch before the eyes, the head bowed to it.
    read("checkWatch", (
      _performance: HumanPerformance,
      reader: HumanSignature.IReader,
      held: number,
      start: number,
    ): void => {
      const eyes = (seconds: number): IAutoMovieVector3 => {
        const left: IAutoMovieVector3 = HumanSignature.joint(
          reader,
          seconds,
          "leftEye",
        );
        const right: IAutoMovieVector3 = HumanSignature.joint(
          reader,
          seconds,
          "rightEye",
        );
        return {
          x: (left.x + right.x) / 2,
          y: (left.y + right.y) / 2,
          z: (left.z + right.z) / 2,
        };
      };
      const wrist: IAutoMovieVector3 = HumanSignature.joint(
        reader,
        held,
        "leftHand",
      );
      const far: number = gap(wrist, eyes(held));
      if (!(far >= 0.3 && far <= 0.4))
        complaints.push(
          `${name}: checkWatch: the watch wrist is ${mm(far)} mm from the eyes, 300 to 400 mm expected`,
        );
      if (!(wrist.z > HumanSignature.joint(reader, held, "chest").z))
        complaints.push(
          `${name}: checkWatch: the watch wrist is not in front of the chest`,
        );

      // The head's pitch: the eyes' drop below the head joint's level,
      // against quiet standing.
      const pitch = (seconds: number): number => {
        const head: IAutoMovieVector3 = HumanSignature.joint(
          reader,
          seconds,
          "head",
        );
        const at: IAutoMovieVector3 = eyes(seconds);
        return (
          (Math.atan2(head.y - at.y, Math.hypot(at.x - head.x, at.z - head.z)) *
            180) /
          Math.PI
        );
      };
      const bowed: number = pitch(held) - pitch(start);
      if (!(bowed >= 10))
        complaints.push(
          `${name}: checkWatch: the head is pitched ${bowed.toFixed(1)} degrees down from quiet standing, at least 10 expected`,
        );
    });
  }
  TestValidator.equals("emblems and habits show their form", complaints, []);
}
