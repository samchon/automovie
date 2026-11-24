import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanSegment,
  IAutoMovieResolvedBone,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanGait,
  HumanChain,
  HumanPerformance,
} from "@automovie/motions";
import { HumanFoot } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/** Standard gravity, m/s² (third CGPM, 1901). */
const G: number = 9.80665;

/**
 * Race walk ten metres (#3870's race-walk movement).
 *
 * Scenarios, on two body proportions:
 * 1. One foot is always on the ground (World Athletics TR54.2): at every
 *    sample a planted window is open and a displayed sole is within 10 mm
 *    of the floor.
 * 2. Through the middle of the walk it goes faster than the fast walk, at the race walk's Froude speed
 *    within 15 %.
 * 3. The take passes the shipped verdicts.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, the speed and the verdicts.
 * @evidence contracts/development/testing.md#behavioral-verification Plans the race-walk row through the public chain and reads its contacts and displayed soles.
 * @evidence contracts/development/testing.md#independent-expectations The rule is TR54.2; the speeds follow from the Froude numbers and the hip height.
 * @evidence contracts/development/testing.md#distinguishing-cases Two bodies; the fast walk's speed as the floor of the race walk's.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances on the shared Human fixture.
 */
export function test_motion_gait_race_walk(): void {
  for (const name of ["f-small", "m-average"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    const film: HumanPerformance = new HumanPerformance({
      seed: "race-walk",
      laws: [AutoMovieMotionHumanGait.HumanRaceGait.raceWalk],
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
        .stand({ hold: 0.3, sway: 0 })
        .registered("raceWalk", { to: { x: 0, y: 0, z: 10 } }).node,
    });
    const race: IAutoMovieMotionHumanSegment = film.segments("a")[1]!;
    const duration: number = race.plan.duration;
    let airborne: number = 0;
    let lifted: number = 0;
    for (let s: number = 0.02; s <= 0.98; s += 0.01) {
      const open: boolean = race.plan.contacts.some(
        (c: IAutoMovieMotionHumanContactWindow): boolean =>
          (c.part === "leftFoot" || c.part === "rightFoot") &&
          (c.kind === "plant" || c.kind === "pivot") &&
          c.from <= s &&
          c.to >= s,
      );
      if (!open) airborne++;
      const t: number = race.start + s * duration;
      const low: number = Math.min(
        ...(["left", "right"] as const).map(
          (side: AutoMovieHumanSide): number => sole(film, body, t, side),
        ),
      );
      if (low > 0.01) lifted++;
    }
    TestValidator.predicate(
      `${name} keeps a foot down (${airborne} unplanted, ${lifted} lifted samples)`,
      airborne === 0 && lifted === 0,
    );
    const l: number = body.measure.hipHeight;
    // The steady pace, over the middle of the walk past its start and stop.
    const a: number = race.start + 0.3 * duration;
    const b: number = race.start + 0.7 * duration;
    const speed: number =
      (film.bones("a", b).get("hips")!.worldPosition.z -
        film.bones("a", a).get("hips")!.worldPosition.z) /
      (b - a);
    const fast: number = Math.sqrt(
      AutoMovieMotionHumanGait.walk.FROUDE.fast * G * l,
    );
    const race0: number = Math.sqrt(
      AutoMovieMotionHumanGait.HumanRaceGait.FROUDE * G * l,
    );
    TestValidator.predicate(
      `${name} race walks at ${speed.toFixed(2)} m/s, past the fast walk's ${fast.toFixed(2)}`,
      speed > fast && Math.abs(speed - race0) <= 0.15 * race0,
    );
    assertTakeClean(`${name} race walk`, film);
  }
}

/** The lowest of a displayed foot's sole points above the floor at a film second. */
function sole(
  film: HumanPerformance,
  body: IAutoMovieMotionHumanBody,
  time: number,
  side: AutoMovieHumanSide,
): number {
  const foot: IAutoMovieResolvedBone = film
    .bones("a", time)
    .get(`${side}Foot`)!;
  const placement: IAutoMovieMotionHumanFoot.IPlacement = {
    ankle: foot.worldPosition,
    rotation: foot.worldRotation,
  };
  return Math.min(
    ...(["heel", "ball", "toe"] as const).map(
      (p: IAutoMovieMotionHumanFoot.Socket): number =>
        HumanFoot.point(body, side, p, placement).y,
    ),
  );
}
