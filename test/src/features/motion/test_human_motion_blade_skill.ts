import { createPell, createSword } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanBlade,
  HumanChain,
  HumanObject,
  HumanPerformance,
  type HumanSegment,
  type IHumanBody,
  type IHumanProp,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * Skill shows in a lunge as the speed of the sword's point.
 *
 * Chen et al. 2017 (PLoS ONE, a scoping review of fencing biomechanics, as
 * #3202 records it) report the sword's peak velocity in the attacking lunge
 * at about 3.2 m/s for experts and 2.6 m/s for novices. The striking
 * family's acceptance holds a reproduced speed to within 20 % of its source
 * (#3362), so the elite point peaks between 2.56 and 3.84 m/s and the
 * novice's between 2.08 and 3.12 m/s, the novice below the elite.
 *
 * Scenarios, on the average man and the small woman lunging with an arming
 * sword at a pell 0.91 of the stature away:
 * 1. Elite and novice: the point's peak speed over the lunge, read from its
 *    displayed place every 1/48 s of its last 0.5 s, lies in its band, and the novice's is
 *    lower than the elite's.
 *
 * A complaint prints, for the two instants about the fastest step, the right
 * arm's joint angles and how far the shown hand is turned from the asked
 * one, so a jump is read to its joint.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds performances through the public chain and input and differentiates the displayed sword point; a lunge too slow or too fast for its skill, or a novice as fast as an elite fails.
 * @evidence contracts/development/testing.md#independent-expectations The speeds are the cited review's with the striking family's 20 % tolerance; a wrong clock or a jumping fit moves the differentiated speed out of its band. Read every 1/48 s, a peak between two readings is under-read by a few percent, inside the tolerance.
 * @evidence contracts/development/testing.md#distinguishing-cases Two skill levels on two bodies of opposite build; seeds and replay are the blade seed test's, the landing the blade strokes test's.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and builds two films a body, each about 20 s while taking a tool for a use costs that; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule with its source and tolerance and the scenario.
 */
export function test_human_motion_blade_skill(): void {
  const sword: ReturnType<typeof createSword> = createSword({
    kind: "armingSword",
  });
  const pell: ReturnType<typeof createPell> = createPell();
  const tip: IAutoMovieVector3 = sword.affordance("point").frame.translation;
  const complaints: string[] = [];
  for (const name of ["m-average", "f-small"] as const) {
    const body: IHumanBody = motionHumanBody(name);
    const stature: number = body.measure.stature;
    const place: { at: IAutoMovieVector3; yaw: number } = {
      at: { x: 0, y: 0, z: 0.91 * stature },
      yaw: 180,
    };
    const stage = (
      level: "novice" | "trained" | "elite",
      seed: string,
    ): {
      point: (seconds: number) => IAutoMovieVector3;
      film: HumanPerformance;
      act: HumanSegment.ISegment;
      at: number;
    } => {
      const film: HumanPerformance = new HumanPerformance({
        seed,
        laws: Object.values(HumanBlade),
        performers: [
          {
            subject: "a",
            body,
            at: { x: 0, y: 0, z: 0 },
            yaw: 0,
            proficiency: { level },
          },
        ],
        props: [
          // The sword lies level before the right hand, point ahead.
          HumanObject.prop("sword", sword, {
            position: {
              x: -0.1 * stature,
              y: 0.6 * stature,
              z: 0.18 * stature,
            },
            rotation: Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, 90),
          }),
          HumanObject.prop("pell", pell, place),
        ],
        composition: HumanChain.subject("a")
          .stand({ seconds: 0.3 })
          .pickUp({
            prop: "sword",
            handle: "grip",
            use: { tip: "point", line: "oblique" },
          })
          .registered("lunge", {
            blade: "sword",
            target: { kind: "prop", subject: "pell", point: "target" },
          }).node,
      });
      const act: HumanSegment.ISegment = film
        .segments("a")
        .find((s: HumanSegment.ISegment): boolean => s.name === "lunge")!;
      return {
        film,
        act,
        at: act.start + (act.plan.contact ?? Number.NaN),
        point: (seconds: number): IAutoMovieVector3 => {
          const frame: IHumanProp.IFrame = film.prop("sword", seconds);
          return Vector3.add(
            frame.position,
            Quaternion.rotateVector(frame.rotation, tip),
          );
        },
      };
    };

    // What a jump of the point is read against at an instant: the right
    // arm's joint angles, how far the shown hand is turned from the asked
    // one, and how far the asked one is turned from the world's axes.
    const shown = (film: HumanPerformance, seconds: number): string => {
      const turn = (a: IAutoMovieQuaternion, b: IAutoMovieQuaternion): number =>
        (2 *
          Math.acos(
            Math.min(
              1,
              Math.abs(a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w),
            ),
          ) *
          180) /
        Math.PI;
      const asked: IAutoMovieQuaternion | undefined = film.posture("a", seconds)
        .limbs.rightArm?.rotation;
      const hand: IAutoMovieQuaternion = film
        .bones("a", seconds)
        .get("rightHand")!.worldRotation;
      const joints: string = ["rightUpperArm", "rightLowerArm", "rightHand"]
        .map((bone: string): string => {
          const found = film
            .pose("a", seconds)
            .joints.find((j): boolean => j.bone === bone);
          return `${bone} ${(found?.flexion ?? 0).toFixed(0)}/${(found?.abduction ?? 0).toFixed(0)}/${(found?.twist ?? 0).toFixed(0)}`;
        })
        .join(", ");
      return `at ${seconds.toFixed(3)} s ${joints} (flexion/abduction/twist), shown hand ${asked === undefined ? "with no asked rotation" : `${turn(asked, hand).toFixed(0)} degrees from the asked one, asked ${turn(asked, { x: 0, y: 0, z: 0, w: 1 }).toFixed(0)} degrees from rest`}, the whole posture (seed skill) ${JSON.stringify(film.posture("a", seconds))}`;
    };

    // 1. The point's peak speed by skill.
    const peaks: Record<"novice" | "elite", number> = { novice: 0, elite: 0 };
    for (const [level, low, high] of [
      ["elite", 2.56, 3.84],
      ["novice", 2.08, 3.12],
    ] as const) {
      const take: ReturnType<typeof stage> = stage(level, "skill");
      const step: number = 1 / 48;
      let peak: number = 0;
      let when: number = take.at;
      for (
        let seconds: number = take.at - 0.5;
        seconds <= take.at;
        seconds += step
      ) {
        const speed: number =
          Vector3.length(
            Vector3.subtract(take.point(seconds), take.point(seconds - step)),
          ) / step;
        if (speed > peak) {
          peak = speed;
          when = seconds;
        }
      }
      peaks[level] = peak;
      if (!(peak >= low && peak <= high))
        complaints.push(
          `${name}, ${level}: the sword's point peaks at ${peak.toFixed(2)} m/s in the lunge, ${low} to ${high} expected; ${shown(take.film, when - step)}; ${shown(take.film, when)}`,
        );
    }
    if (!(peaks.novice < peaks.elite))
      complaints.push(
        `${name}: the novice's point peaks at ${peaks.novice.toFixed(2)} m/s and the elite's at ${peaks.elite.toFixed(2)} m/s, the novice lower expected`,
      );
  }
  TestValidator.equals("skill shows in a lunge", complaints, []);
}
