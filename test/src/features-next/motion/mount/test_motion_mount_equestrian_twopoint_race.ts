import { createHorse, rideHorse } from "@automovie/archetypes";
import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanMounted,
  IAutoMovieMotionHumanSegment,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanSignature } from "@automovie/motions";
import { HumanFoot } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { mountedHorseScene } from "../../../features/internal/mountedHorseScene";

/** The campaign's held-contact bound, metres. */
const CONTACT: number = 0.01;

/** Seconds the horse stands in the gate. */
const WAIT: number = 7;

/** The stirrups and reins every figure keeps. */
const HOLD: IAutoMovieMotionHumanMounted.ISupports = {
  leftFoot: "leftStirrup",
  rightFoot: "rightStirrup",
  leftHand: "leftRein",
  rightHand: "rightRein",
};

/**
 * A race from the gate to the pull-up: the rider waits seated in the gate,
 * breaks into the racing crouch as the horse leaves its standstill, rides
 * the run in the crouch, stands in the stirrups as the horse pulls up after
 * the line and sits down once it has stopped.
 *
 * Scenarios:
 * 1. Gate break: the crouch's transfer begins at the instant the horse's root first moves, within a 60th of a second, and the seat region has left the saddle by more than 30 mm (`HumanMountedStirrups.CLEAR`) when the transfer arrives.
 * 2. Pull-up: standing begins when the horse starts to slow, and the final seated figure arrives only after the horse's root has stopped (under 0.05 m/s); the seat region is then within 10 mm of the saddle.
 * 3. Both balls of the feet stay within 10 mm of their stirrups' treads at every figure's hold and halfway through every transfer.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the race, its three scenarios and each bound's source.
 * @evidence contracts/development/testing.md#behavioral-verification Runs the mounted law over an actual horse that starts from standstill, canters and stops, and reads the displayed seat and feet against its moving saddle and stirrups and its root's speed; a crouch that starts before or after the break, a sit-down before the stop or a foot off its stirrup fails.
 * @evidence contracts/development/testing.md#independent-expectations The break and the stop are read from the horse's own root; the bounds are the campaign's.
 * @evidence contracts/development/testing.md#distinguishing-cases Standstill against travel, accelerating against slowing, seated against out of the saddle.
 * @evidence contracts/development/testing.md#execution-ownership One in-memory film of one polygon man, its timing read from a first planning pass of the same scene.
 */
export function test_motion_mount_equestrian_twopoint_race(): void {
  const findings: string[] = [];
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-tall");
  const horse: mountedHorseScene.Horse = createHorse(
    { withersHeight: 1.65, stirrupDrop: 0.575, tempo: 0 },
    8,
  );
  const speed: number = 5 * Math.sqrt(1.65 / 1.38);
  const course: mountedHorseScene.Ride = rideHorse(
    horse,
    {
      start: { x: 0, z: 0, heading: 0 },
      cruise: speed,
      startSpeed: 0,
      endSpeed: 0,
      acceleration: 2,
      deceleration: 2,
      startFromStanding: true,
      legs: [{ kind: "straight", length: speed * 6 }],
    },
    "canter",
  );
  const moving = (at: number): number =>
    Vector3.distance(
      course.at(Math.max(0, at - WAIT)).placement.translation,
      course.at(Math.max(0, at - WAIT + 1 / 60)).placement.translation,
    ) * 60;
  const slowing: number = WAIT + course.duration - speed / 2;
  const stopped: number = WAIT + course.duration;

  // A first pass finds when the rider is seated; the figures are then timed to the gate and the stop.
  const probe: mountedHorseScene.IScene = stage(horse, body, course, [
    { seat: "entered", transfer: 0.3, hold: 0.2, supports: HOLD },
  ]);
  const begun: number = probe.segments[probe.segments.length - 1]!.start;
  const gate: number = WAIT - begun - 0.3;
  const figures: IAutoMovieMotionHumanMounted.IFigure[] = [
    { seat: "entered", transfer: 0.3, hold: gate, supports: HOLD },
    {
      seat: "crouch",
      transfer: 0.6,
      hold: slowing - WAIT - 0.6,
      supports: HOLD,
    },
    {
      seat: "standing",
      transfer: 0.6,
      hold: stopped - slowing - 0.6,
      supports: HOLD,
    },
    { seat: "entered", transfer: 0.8, hold: 0.5, supports: HOLD },
  ];
  const scene: mountedHorseScene.IScene = stage(horse, body, course, figures);
  const take: IAutoMovieMotionHumanSegment = scene.segments.find(
    (segment: IAutoMovieMotionHumanSegment): boolean =>
      segment.plan.events.some((e): boolean => e.name === "crouch:1"),
  )!;
  const length: number = take.end - take.start;
  const arrive = (i: number): number =>
    take.start + take.plan.events[i]!.share * length;
  const begin = (i: number): number => arrive(i) - figures[i]!.transfer;
  const seat = (at: number): number =>
    mountedHorseScene.local(
      scene.part("seat", at),
      HumanSignature.region(scene.reader, "seat", at),
    ).y;

  // 1. The gate break.
  let first: number = WAIT - 1;
  while (moving(first) < 1e-6 && first < WAIT + 1) first += 1 / 120;
  if (Math.abs(begin(1) - first) > 1 / 60)
    findings.push(
      `the crouch begins at ${begin(1).toFixed(3)} s, the horse leaves at ${first.toFixed(3)} s`,
    );
  if (!(seat(arrive(1)) > 0.03))
    findings.push(
      `at the break the seat stands ${seat(arrive(1)).toFixed(3)} m over the saddle`,
    );

  // 2. The pull-up.
  if (Math.abs(begin(2) - slowing) > 1 / 60)
    findings.push(
      `standing begins at ${begin(2).toFixed(3)} s, the horse slows at ${slowing.toFixed(3)} s`,
    );
  if (!(moving(arrive(3)) < 0.05))
    findings.push(
      `the rider sits down while the horse still moves at ${moving(arrive(3)).toFixed(3)} m/s`,
    );
  if (Math.abs(seat(arrive(3) + 0.25)) > CONTACT)
    findings.push(
      `after the stop the seat stands ${seat(arrive(3) + 0.25).toFixed(3)} m over the saddle`,
    );

  // 3. The stirrups throughout.
  const ball = (side: "left" | "right", at: number): IAutoMovieVector3 =>
    mountedHorseScene.local(
      scene.part(`${side}Stirrup`, at),
      HumanFoot.sockets(
        body,
        HumanSignature.bones(scene.reader, at),
        side,
      ).find(
        (s: IAutoMovieMotionHumanFoot.ISocket): boolean => s.socket === "ball",
      )!.point,
    );
  const rested: Record<"left" | "right", IAutoMovieVector3> = {
    left: ball("left", arrive(0)),
    right: ball("right", arrive(0)),
  };
  for (let i: number = 0; i < figures.length; ++i)
    for (const at of [
      (begin(i) + arrive(i)) / 2,
      arrive(i) + figures[i]!.hold / 2,
    ])
      for (const side of ["left", "right"] as const) {
        const foot: IAutoMovieVector3 = ball(side, at);
        if (
          Math.abs(foot.y) > CONTACT ||
          Vector3.distance(foot, rested[side]) > CONTACT
        )
          findings.push(
            `the ${side} ball leaves its stirrup at ${at.toFixed(2)} s`,
          );
      }

  assertTakeClean("the race", scene.film);
  TestValidator.equals("a race from the gate to the pull-up", findings, []);
}

/** Sit, then the figures over the race's own course. */
function stage(
  horse: mountedHorseScene.Horse,
  body: IAutoMovieMotionHumanBody,
  course: mountedHorseScene.Ride,
  figures: IAutoMovieMotionHumanMounted.IFigure[],
): mountedHorseScene.IScene {
  return mountedHorseScene.build({
    horse,
    body,
    gait: "canter",
    wait: WAIT,
    course,
    from: { x: 0.6, y: 0, z: -0.2 },
    acts: (seated) =>
      seated
        .registered("ride", {
          on: "horse",
          duration: 0.6,
          seat: "seat",
          feet: { left: "leftStirrup", right: "rightStirrup" },
          hands: { left: "leftRein", right: "rightRein" },
        })
        .registered("mounted", { on: "horse", frame: "seat", figures }),
  });
}
