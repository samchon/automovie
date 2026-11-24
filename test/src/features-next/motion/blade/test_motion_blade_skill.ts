import { createPell, createSword } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanSegment,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanBlade,
  HumanChain,
  HumanObject,
  HumanPerformance,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionBladeReach } from "../../../features/internal/motionBladeReach";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/** The proficiency levels whose cited lunge speeds the spec compares. */
type Level = "novice" | "elite";

/** One staged lunge and the displayed sword point it is read from. */
interface ITake {
  /** The performance holding the lunge. */
  film: IAutoMovieMotionHumanPerformance;

  /** The lunge's segment. */
  act: IAutoMovieMotionHumanSegment;

  /** The lunge's decisive instant, film seconds. */
  at: number;

  /** The displayed sword point at a film second, world metres. */
  point: (seconds: number) => IAutoMovieVector3;
}

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
 * sword at a pell that needs a full lunge:
 * 1. Elite and novice: the point's peak speed over the attack, from the
 *    lunge's `strokeStart` to its decisive instant, read from its displayed
 *    place every 1/240 s, lies in its band.
 * 2. The novice's peak is lower than the elite's on the same body.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the rule with its source and tolerance and the scenarios.
 * @evidence contracts/development/testing.md#behavioral-verification Builds performances through the public chain and differentiates the displayed sword point over the whole attack phase; a lunge too slow or too fast for its skill, or a novice as fast as an elite, fails.
 * @evidence contracts/development/testing.md#independent-expectations The speeds are the cited review's with the striking family's 20 % tolerance, independent of the clock under test. Read every 1/240 s, a minimum-jerk peak between two readings is under-read by well under one percent.
 * @evidence contracts/development/testing.md#distinguishing-cases Two skill levels on two bodies of opposite build with the same seed; the order check separates a skill-blind clock from one in band by chance. Seeds, replay and the landing belong to the other blade specs.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory performances through the public chain, with no host or capture.
 */
export function test_motion_blade_skill(): void {
  const sword: ReturnType<typeof createSword> = createSword({
    kind: "armingSword",
  });
  const pell: ReturnType<typeof createPell> = createPell();
  const tip: IAutoMovieVector3 = sword.affordance("point").frame.translation;
  const complaints: string[] = [];
  for (const name of ["m-average", "f-small"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    const stature: number = body.measure.stature;
    const place: ReturnType<typeof motionBladeReach.lunge> =
      motionBladeReach.lunge(body, sword, pell, 0, 1);
    const stage = (level: Level): ITake => {
      const film: IAutoMovieMotionHumanPerformance = new HumanPerformance({
        seed: "skill",
        laws: Object.values(AutoMovieMotionHumanBlade.HumanBlade),
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
          .stand({ hold: 0.3 })
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
      const act: IAutoMovieMotionHumanSegment = film
        .segments("a")
        .find(
          (s: IAutoMovieMotionHumanSegment): boolean => s.name === "lunge",
        )!;
      return {
        film,
        act,
        at: act.start + (act.plan.contact ?? Number.NaN),
        point: (seconds: number): IAutoMovieVector3 => {
          const frame: IAutoMovieRigidTransform = film.prop("sword", seconds);
          return Vector3.add(
            frame.position,
            Quaternion.rotateVector(frame.rotation, tip),
          );
        },
      };
    };

    const peaks: Record<Level, number> = { novice: 0, elite: 0 };
    for (const [level, low, high] of [
      ["elite", 2.56, 3.84],
      ["novice", 2.08, 3.12],
    ] as const) {
      const take: ITake = stage(level);
      const step: number = 1 / 240;
      const attack: number | undefined = take.act.plan.events.find(
        (event: IAutoMovieMotionEvent): boolean => event.name === "strokeStart",
      )?.share;
      if (attack === undefined) {
        complaints.push(`${name}, ${level}: the lunge names no strokeStart`);
        continue;
      }
      let peak: number = 0;
      for (
        let seconds: number =
          take.act.start + attack * take.act.plan.duration + step;
        seconds <= take.at + 1e-9;
        seconds += step
      )
        peak = Math.max(
          peak,
          Vector3.length(
            Vector3.subtract(take.point(seconds), take.point(seconds - step)),
          ) / step,
        );
      peaks[level] = peak;
      if (!(peak >= low && peak <= high))
        complaints.push(
          `${name}, ${level}: the sword's point peaks at ${peak.toFixed(2)} m/s in the lunge, ${low} to ${high} expected; lunge ${take.act.start.toFixed(3)} to ${take.act.end.toFixed(3)} s, contact ${take.at.toFixed(3)} s, events ${JSON.stringify(take.act.plan.events)}`,
        );
    }
    if (!(peaks.novice < peaks.elite))
      complaints.push(
        `${name}: the novice's point peaks at ${peaks.novice.toFixed(2)} m/s and the elite's at ${peaks.elite.toFixed(2)} m/s, the novice lower expected`,
      );
  }
  TestValidator.equals("skill shows in a lunge", complaints, []);
}
