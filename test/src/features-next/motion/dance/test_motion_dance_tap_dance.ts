import type {
  AutoMovieHumanSide,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionHumanTapDance,
  IAutoMovieResolvedBone,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanDance,
  HumanChain,
  HumanPerformance,
} from "@automovie/motions";
import { HumanFoot } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/** The strike's contact bound, metres. */
const TOUCH: number = 0.005;

/** The tempo danced, beats per minute. */
const BPM: number = 120;

/**
 * Tap a single time step and a cramp roll on the beat (#3991's tap).
 *
 * Scenarios, on two body proportions:
 * 1. Every sounding strike's event falls on a quarter-beat subdivision of
 *    the 120 bpm clock, to the microsecond.
 * 2. At that instant the named part meets the floor: the ball socket for a
 *    ball tap, the heel socket for a heel drop, both for a flat step,
 *    within 5 mm.
 * 3. Each take passes the shipped verdicts.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the beat rule, the contact rule and the verdicts.
 * @evidence contracts/development/testing.md#behavioral-verification Plans the tap row through the public chain and reads its events and the displayed feet.
 * @evidence contracts/development/testing.md#independent-expectations The subdivisions follow from the tempo alone; the part is the one the event names.
 * @evidence contracts/development/testing.md#distinguishing-cases Two bodies, and a step with a hop beside one with heel drops.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances on the shared Human fixture.
 */
export function test_motion_dance_tap_dance(): void {
  const quarter: number = 60 / BPM / 4;
  for (const name of ["f-small", "m-average"] as const)
    for (const step of ["timeStep", "crampRoll"] as const) {
      const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
      const film: HumanPerformance = take(body, step);
      const tap: IAutoMovieMotionHumanSegment = film.segments("a")[1]!;
      const strikes: readonly IAutoMovieMotionEvent[] = tap.plan.events.filter(
        (e: IAutoMovieMotionEvent): boolean => e.name.startsWith("strike"),
      );
      for (const e of strikes) {
        const local: number = e.share * tap.plan.duration;
        const grid: number = local / quarter;
        const t: number = tap.start + local;
        const match: RegExpMatchArray = e.name.match(
          /^strike\d+(Left|Right)(Ball|Heel|Flat)$/,
        )!;
        const side: AutoMovieHumanSide = match[1] === "Left" ? "left" : "right";
        const sockets: readonly IAutoMovieMotionHumanFoot.Socket[] =
          match[2] === "Ball"
            ? ["ball"]
            : match[2] === "Heel"
              ? ["heel"]
              : ["heel", "ball"];
        const high: number = Math.max(
          ...sockets.map((s: IAutoMovieMotionHumanFoot.Socket): number =>
            height(film, body, t, side, s),
          ),
        );
        TestValidator.predicate(
          `${name} ${step} ${e.name} on its subdivision (${grid.toFixed(6)}) and down (${(high * 1000).toFixed(1)} mm)`,
          Math.abs(grid - Math.round(grid)) <= 1e-6 / quarter && high <= TOUCH,
        );
      }
      TestValidator.predicate(
        `${name} ${step} sounds its strikes`,
        strikes.length >= 4,
      );
      assertTakeClean(`${name} ${step}`, film);
    }
}

/** A performer dancing one tap step. */
function take(
  body: IAutoMovieMotionHumanBody,
  step: IAutoMovieMotionHumanTapDance.Step,
): HumanPerformance {
  return new HumanPerformance({
    seed: "tap",
    laws: [AutoMovieMotionHumanDance.HumanDanceStyles.tap],
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
      .registered("tap", { step, bpm: BPM, repeats: 2 }).node,
  });
}

/** A displayed foot socket's height above the floor at a film second. */
function height(
  film: HumanPerformance,
  body: IAutoMovieMotionHumanBody,
  time: number,
  side: AutoMovieHumanSide,
  socket: IAutoMovieMotionHumanFoot.Socket,
): number {
  const foot: IAutoMovieResolvedBone = film
    .bones("a", time)
    .get(`${side}Foot`)!;
  return HumanFoot.point(body, side, socket, {
    ankle: foot.worldPosition,
    rotation: foot.worldRotation,
  }).y;
}
