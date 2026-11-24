import { createWall } from "@automovie/archetypes";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieAffordance,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionHumanSkydive,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanAcrobatics,
  HumanChain,
  HumanObject,
  HumanPerformance,
} from "@automovie/motions";

import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { motionComplaints } from "../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { motionHumanRefusal } from "../../../features/internal/motionHumanRefusal";
import { motionHumanRepeat } from "../../../features/internal/motionHumanRepeat";

/** The exit's height above the landing ground, metres: the wall's base. */
const BASE: number = 400;

/** The deployment altitude, metres. */
const DEPLOY: number = 150;

/** The arch's whole-body pitch, degrees, and how far a freefall may stray from it. */
const ARCH: number = 88;
const ARCH_TOLERANCE: number = 5;

/** The terminal speed the jump states, metres per second. */
const TERMINAL: number = 53;

/** A track's speed, metres per second. */
const TRACK: number = 5;

/** The parachute landing fall's points of contact after the feet, in order. */
const POINTS: readonly string[] = ["calf", "thigh", "buttock", "pushUp"];

/**
 * A parachute jump (#3993).
 *
 * Scenarios, on the average man and the small woman:
 * 1. Freefall holds the arch within its tolerance after the exit turn, its
 *    descent speed nears the terminal speed's drag curve by the deployment,
 *    and a track carries the body further along its heading.
 * 2. Under the canopy a left toggle turns the heading left.
 * 3. The parachute landing fall touches the calf, thigh, buttock and
 *    push-up muscle in order and ends lying on the ground; a stand-up
 *    landing ends on the feet.
 * 4. A deployment too low for the canopy is refused; the jump seeks
 *    repeatably.
 * Every take passes the shipped verdicts.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each phase, the checks and the refusal.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the displayed posture, hips and contact windows over the flight and landing, and the take through the shipped verdicts and a second read.
 * @evidence contracts/development/testing.md#independent-expectations The drag curve, the track's distance and the five points' order are stated here.
 * @evidence contracts/development/testing.md#distinguishing-cases Plain, tracked and steered jumps, both landings and the refusal on two bodies.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances through the public chain.
 */
export function test_motion_acrobatics_skydive(): void {
  const all: motionComplaints.IGatherer = motionComplaints();
  const wall = createWall({ kind: "full" });
  const top: IAutoMovieVector3 = wall.affordances.find(
    (a: IAutoMovieAffordance): boolean => a.id === "top",
  )!.frame.translation;
  const exit: IAutoMovieMotionHumanProp = HumanObject.prop("roof", wall, {
    at: { x: 0, y: BASE, z: 0 },
    yaw: 0,
    fixed: true,
  });
  const g: number = 9.80665;
  for (const fit of ["m-average", "f-small"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(fit);
    const jump = (
      p: Partial<IAutoMovieMotionHumanSkydive.IParams>,
    ): HumanPerformance =>
      new HumanPerformance({
        seed: "skydive",
        performers: [
          {
            subject: "a",
            body,
            at: { x: 0, y: BASE + top.y, z: 0 },
            yaw: 0,
            proficiency: { level: "trained" },
          },
        ],
        props: [exit],
        laws: [AutoMovieMotionHumanAcrobatics.skydive.skydive],
        composition: HumanChain.subject("a").registered("skydive", {
          from: "roof",
          edge: "top",
          deploy: DEPLOY,
          ...p,
        }).node,
      });
    const segment = (take: HumanPerformance): IAutoMovieMotionHumanSegment =>
      take
        .segments("a")
        .find(
          (s: IAutoMovieMotionHumanSegment): boolean =>
            s.law.name === "skydive",
        )!;
    const at = (s: IAutoMovieMotionHumanSegment, name: string): number =>
      s.start +
      s.plan.events.find(
        (e: IAutoMovieMotionEvent): boolean => e.name === name,
      )!.share *
        (s.end - s.start);
    const hips = (take: HumanPerformance, t: number): IAutoMovieVector3 =>
      take.bones("a", t).get("hips")!.worldPosition;

    // 1, 3. The plain jump with the landing fall.
    let plain: HumanPerformance | undefined;
    try {
      plain = jump({});
      assertTakeClean(`${fit} skydive`, plain);
      const s: IAutoMovieMotionHumanSegment = segment(plain);
      const deploy: number = at(s, "deploy");
      for (let t: number = s.start + 1.2; t < deploy; t += 0.5) {
        const pitch: number = plain.posture("a", t).pitch;
        all.check(
          `${fit} freefall holds the arch at ${t.toFixed(1)} s (${pitch.toFixed(1)}°)`,
          Math.abs(pitch - ARCH) <= ARCH_TOLERANCE,
        );
      }
      const speed: number =
        (hips(plain, deploy - 0.05).y - hips(plain, deploy - 0.01).y) / 0.04;
      const curve: number =
        TERMINAL * Math.tanh((g * (deploy - s.start)) / TERMINAL);
      all.check(
        `${fit} freefall falls at the drag curve's ${curve.toFixed(1)} m/s by deployment (${speed.toFixed(1)})`,
        Math.abs(speed - curve) <= 0.03 * curve,
      );
      const windows: IAutoMovieMotionHumanContactWindow[] = s.plan.contacts;
      const starts: number[] = (
        ["leftLowerLeg", "leftUpperLeg", "seat", "back"] as const
      ).map(
        (part: IAutoMovieMotionHumanContactWindow["part"]): number =>
          windows.find(
            (w: IAutoMovieMotionHumanContactWindow): boolean => w.part === part,
          )!.from,
      );
      all.check(
        `${fit} the landing fall's points come in order`,
        starts.every(
          (v: number, i: number): boolean => i === 0 || v > starts[i - 1]!,
        ),
      );
      all.check(
        `${fit} the landing fall's events are the four later points in order`,
        s.plan.events
          .filter((e: IAutoMovieMotionEvent): boolean =>
            POINTS.includes(e.name),
          )
          .map((e: IAutoMovieMotionEvent): string => e.name)
          .join(",") === POINTS.join(","),
      );
      all.check(
        `${fit} the landing fall ends lying on the ground (hips ${hips(plain, s.end).y.toFixed(3)} m)`,
        hips(plain, s.end).y <= 0.3,
      );
    } catch (error: unknown) {
      all.check(`${fit} skydive: ${String(error)}`, false);
    }

    // 1. The track.
    try {
      const tracked: HumanPerformance = jump({
        track: TRACK,
        landing: "standUp",
      });
      assertTakeClean(`${fit} tracked skydive`, tracked);
      if (plain !== undefined) {
        const s: IAutoMovieMotionHumanSegment = segment(tracked);
        const deploy: number = at(s, "deploy");
        const gained: number = hips(tracked, deploy).z - hips(plain, deploy).z;
        all.check(
          `${fit} the track carries the body ${(TRACK * (deploy - s.start)).toFixed(1)} m further along its heading (${gained.toFixed(1)})`,
          Math.abs(gained - TRACK * (deploy - s.start)) <=
            0.1 * TRACK * (deploy - s.start),
        );
      }
      const end = tracked.bones("a", tracked.duration);
      all.check(
        `${fit} a stand-up landing ends on the feet`,
        (["leftToes", "rightToes"] as const).every(
          (b: AutoMovieHumanoidBone): boolean =>
            end.get(b)!.worldPosition.y <= 0.03,
        ),
      );
    } catch (error: unknown) {
      all.check(`${fit} tracked skydive: ${String(error)}`, false);
    }

    // 2. The toggle turn.
    try {
      const steered: HumanPerformance = jump({
        toggles: [{ at: 2, side: "left", hold: 2 }],
      });
      assertTakeClean(`${fit} steered skydive`, steered);
      const s: IAutoMovieMotionHumanSegment = segment(steered);
      const open: number = at(s, "open");
      const before: number = steered.posture("a", open + 1.5).yaw;
      const after: number = steered.posture("a", open + 4.5).yaw;
      all.check(
        `${fit} a left toggle turns the heading left (${before.toFixed(1)}° to ${after.toFixed(1)}°)`,
        after - before > 30,
      );
    } catch (error: unknown) {
      all.check(`${fit} steered skydive: ${String(error)}`, false);
    }

    // 4. The refusal and repeatability.
    all.check(
      `${fit} a deployment too low for the canopy is refused`,
      motionHumanRefusal(() => jump({ deploy: 40 }).bones("a", 0.5), {
        kind: "reach",
        axis: "deploy",
        act: "skydive",
      }),
    );
    if (plain !== undefined && fit === "m-average")
      for (const complaint of motionHumanRepeat(plain, jump({}), "a", 4))
        all.check(`${fit} repeats: ${complaint}`, false);
  }
  all.assert("skydive");
}
