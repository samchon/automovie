import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionHumanStreetDance,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanDance,
  HumanChain,
  HumanPerformance,
} from "@automovie/motions";
import { HumanFoot } from "@automovie/motions/internal";

import { assertTakeClean } from "../../internal/assertTakeClean";
import { everydayTake } from "../../internal/everydayTake";
import { motionComplaints } from "../../internal/motionComplaints";
import { motionHumanBody } from "../../internal/motionHumanBody";

/** The tempo, beats per minute. */
const BPM: number = 120;

/**
 * Moonwalk and rock with popping hits (#4010's street grooves).
 *
 * Scenarios, on two body proportions:
 *
 * 1. In the moonwalk each sliding foot stays on the floor, its sole within 8 mm of
 *    it and moving no more than 3 mm vertically, while the hips travel
 *    backward; the standing foot is on its ball, the heel at least 30 mm up;
 *    and the roles change each beat.
 * 2. In the rock each popping hit's event falls on its quarter-beat subdivision
 *    offset by the member's draw, and the forearm's elbow is at its most bent
 *    at that instant within a frame.
 * 3. Two members with different seeds keep their beats within the authored
 *    variation and do not move alike.
 * 4. Each take passes the shipped verdicts.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the backslide's rules, the hits' timing, the variation and the verdicts.
 * @evidence contracts/development/testing.md#behavioral-verification Plans the street row through the public chain and reads its events and the displayed feet, hips and elbow.
 * @evidence contracts/development/testing.md#independent-expectations The subdivisions follow from the tempo; the slide bound is a still floor's; the heel bound is the law's stated lift's order.
 * @evidence contracts/development/testing.md#distinguishing-cases Two bodies, two grooves and two seeds.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances on the shared Human fixture.
 */
export function test_motion_dance_street_dance(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  const period: number = 60 / BPM;
  for (const name of ["f-small", "m-average"] as const) {
    try {
      const body: IAutoMovieMotionHumanBody = motionHumanBody(name);

      // 1. Moonwalk.
      const moon: HumanPerformance = take(
        body,
        { groove: "moonwalk", bpm: BPM, count: 4, vary: 0 },
        "moon",
      );
      const walk: IAutoMovieMotionHumanSegment = moon.segments("a")[1]!;
      let floating: number = 0;
      let heels: number = Infinity;
      for (let k: number = 1; k <= 4; k++) {
        const slider: AutoMovieHumanSide = k % 2 === 1 ? "right" : "left";
        const stander: AutoMovieHumanSide =
          slider === "right" ? "left" : "right";
        const from: number = walk.start + at(walk, `slide${k}`) + 0.01;
        const to: number = from + 0.6 * period;
        let low: number = Infinity;
        let high: number = -Infinity;
        for (let t: number = from; t <= to; t += 1 / 48) {
          const y: number = Math.min(
            sole(moon, body, t, slider, "heel"),
            sole(moon, body, t, slider, "ball"),
          );
          low = Math.min(low, y);
          high = Math.max(high, y);
          heels = Math.min(
            heels,
            sole(moon, body, t, stander, "heel") -
              sole(moon, body, t, stander, "ball"),
          );
        }
        floating = Math.max(floating, high - low, Math.abs(low) - 0.005);
      }
      const start: IAutoMovieVector3 = hips(moon, walk.start);
      const end: IAutoMovieVector3 = hips(moon, walk.end);
      checks.check(
        `${name} moonwalk slides flat (${(floating * 1000).toFixed(1)} mm), stands on the ball (heel ${(heels * 1000).toFixed(0)} mm up) and travels back ${((start.z - end.z) * 1000).toFixed(0)} mm`,
        floating <= 0.003 && heels >= 0.03 && start.z - end.z >= 0.3,
      );
      verdict(checks, `${name} moonwalk`, moon);

      // 2. Rock hits.
      const rock: HumanPerformance = take(
        body,
        { groove: "rock", bpm: BPM, count: 4, hits: [2, 6, 10, 14] },
        "rock",
      );
      const groove: IAutoMovieMotionHumanSegment = rock.segments("a")[1]!;
      const offset: number = at(groove, "beat1") - period;
      let worst: number = 0;
      for (let n: number = 1; n <= 4; n++) {
        const local: number = at(groove, `hit${n}`);
        const grid: number = (local - offset) / (period / 4) - 4;
        worst = Math.max(worst, Math.abs(grid - (4 * n - 2)));
        const t: number = groove.start + local;
        const bent: number = elbow(rock, t);
        checks.check(
          `${name} hit ${n} peaks on its beat`,
          bent >= elbow(rock, t - 1 / 24) && bent >= elbow(rock, t + 1 / 24),
        );
      }
      checks.check(`${name} hits land on their subdivisions`, worst <= 1e-6);
      verdict(checks, `${name} rock`, rock);
    } catch (error: unknown) {
      checks.check(`${String(name)}: ${everydayTake.describe(error)}`, false);
    }
  }

  // 3. Seeded variation.
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const vary: number = 0.03;
  const one: IAutoMovieMotionHumanSegment = take(
    body,
    { groove: "rock", bpm: BPM, count: 4, vary },
    "one",
  ).segments("a")[1]!;
  const two: IAutoMovieMotionHumanSegment = take(
    body,
    { groove: "rock", bpm: BPM, count: 4, vary },
    "two",
  ).segments("a")[1]!;
  const a: number = at(one, "beat1") - period;
  const b: number = at(two, "beat1") - period;
  checks.check(
    `members keep the beat within ${vary * 1000} ms and differ (${(a * 1000).toFixed(1)} and ${(b * 1000).toFixed(1)} ms)`,
    Math.abs(a) <= vary && Math.abs(b) <= vary && a !== b,
  );
  checks.assert("dance street dance");
}

/** A performer dancing one groove after a brief stand. */
function take(
  body: IAutoMovieMotionHumanBody,
  params: IAutoMovieMotionHumanStreetDance.IParams,
  seed: string,
): HumanPerformance {
  return new HumanPerformance({
    seed,
    laws: [AutoMovieMotionHumanDance.HumanDanceStyles.streetGroove],
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
      .registered("streetGroove", params).node,
  });
}

/** An event's action second. */
function at(segment: IAutoMovieMotionHumanSegment, name: string): number {
  return (
    segment.plan.events.find(
      (e: IAutoMovieMotionEvent): boolean => e.name === name,
    )!.share * segment.plan.duration
  );
}

/** A displayed foot socket's height at a film second. */
function sole(
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

/** The displayed hips at a film second. */
function hips(film: HumanPerformance, time: number): IAutoMovieVector3 {
  return film.bones("a", time).get("hips")!.worldPosition;
}

/** The right elbow's bend at a film second, degrees. */
function elbow(film: HumanPerformance, time: number): number {
  const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = film.bones(
    "a",
    time,
  );
  const upper: IAutoMovieVector3 = Vector3.subtract(
    bones.get("rightLowerArm")!.worldPosition,
    bones.get("rightUpperArm")!.worldPosition,
  );
  const lower: IAutoMovieVector3 = Vector3.subtract(
    bones.get("rightHand")!.worldPosition,
    bones.get("rightLowerArm")!.worldPosition,
  );
  return (
    (Math.acos(
      Vector3.dot(Vector3.normalize(upper), Vector3.normalize(lower)),
    ) *
      180) /
    Math.PI
  );
}

/** Gather a take's shipped verdicts as one check. */
function verdict(
  checks: motionComplaints.IGatherer,
  label: string,
  film: HumanPerformance,
): void {
  try {
    assertTakeClean(label, film);
  } catch (error: unknown) {
    checks.check(
      `${label}: ${error instanceof Error ? error.message : String(error)}`,
      false,
    );
  }
}
