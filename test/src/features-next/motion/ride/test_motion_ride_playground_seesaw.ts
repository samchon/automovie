import { createSeesaw, rideSeesaw } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieComposition,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanSeated,
  IAutoMovieMotionHumanSegment,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanRide,
  HumanChain,
  HumanObject,
  HumanPerformance,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { playgroundTake } from "../../../features/internal/playgroundTake";

/**
 * Two riders sit on a seesaw and rock it by pushing off at the low end
 * (#3989).
 *
 * Scenarios, the average man at the front and the small woman at the rear:
 * 1. Each rider's pelvis stays on its seat and hands on its handles.
 * 2. A foot is on the ground only while that end is low, and each end's
 *    feet reach the ground there.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the equipment, bodies, contacts and checked frames.
 * @evidence contracts/development/testing.md#behavioral-verification Reads displayed pelvis and ankles against the actual beam frame of the ride.
 * @evidence contracts/development/testing.md#independent-expectations The beam frame comes from the ride; contacts hold within the 20 mm ride tolerance; the reach a foot has from a seat is the body's own shank, ankle and a fifth of its hip height.
 * @evidence contracts/development/testing.md#distinguishing-cases Low and high seesaw ends, two bodies of different sizes at opposite ends.
 * @evidence contracts/development/testing.md#execution-ownership In-memory archetypes, rides and Human performances; no host.
 */
export function test_motion_ride_playground_seesaw(): void {
  const failures: string[] = [];
  seesaw(failures);
  TestValidator.equals("seesaw ride", failures, []);
}
/** Two riders rock a seesaw by pushing off at the low end. */
function seesaw(failures: string[]): void {
  const post: ReturnType<typeof createSeesaw> = createSeesaw({
    pivot: 0.55,
    length: 3.2,
  });
  const beam: ReturnType<typeof createSeesaw.beam> = createSeesaw.beam(post);
  // The beam is held level while both riders sit, then let go to rock: the
  // sits are measured on the held beam and the release follows them.
  const sitting: number = 1.2;
  const placed: IAutoMovieRigidTransform = {
    position: { x: 0, y: post.dimensions.pivot!, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
  };
  const ends: readonly SeesawEnd[] = ["front", "rear"];
  const keys: readonly playgroundTake.BodyKey[] = ["m-average", "f-small"];
  const performers: playgroundTake.Performer[] = ends.map(
    (end: SeesawEnd, index: number): playgroundTake.Performer => {
      const seat: IAutoMovieMotionHumanSeated.ISeat = HumanObject.seat(
        beam,
        placed,
        `${end}Seat`,
      );
      const ahead: IAutoMovieVector3 = Quaternion.rotateVector(
        Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, seat.yaw),
        { x: 0, y: 0, z: 0.3 },
      );
      return {
        subject: end,
        body: motionHumanBody(keys[index]!),
        at: { ...Vector3.add(seat.at, ahead), y: 0 },
        yaw: seat.yaw,
        proficiency: { level: "trained" as const },
      };
    },
  );
  const sit = (end: SeesawEnd): ReturnType<typeof HumanChain.subject> =>
    HumanChain.subject(end).sit({
      seat: HumanObject.seat(beam, placed, `${end}Seat`),
      hold: sitting,
    });
  const seated: number = new HumanPerformance({
    seed: "seesaw",
    performers,
    props: [HumanObject.prop("beam", beam, placed)],
    composition: {
      kind: "parallel",
      parts: ends.map((end: SeesawEnd): IAutoMovieComposition => sit(end).node),
    },
  }).duration;
  const settle: number = seated + 0.3;
  const ride: rideSeesaw.IRide = rideSeesaw(post, playgroundTake.ORIGIN, {
    settle,
    pushes: [settle + 1.5, settle + 3.5, settle + 5.5],
    swing: 1.2,
  });
  const beamAt = (seconds: number): IAutoMovieRigidTransform =>
    playgroundTake.rigid(ride.beam(seconds));
  const film: HumanPerformance = new HumanPerformance({
    seed: "seesaw",
    performers,
    props: [
      HumanObject.prop(
        "post",
        post,
        playgroundTake.rigid(playgroundTake.ORIGIN),
      ),
      HumanObject.prop("beam", beam, placed, beamAt),
    ],
    laws: [AutoMovieMotionHumanRide.HumanSurface.seesawRide],
    composition: {
      kind: "parallel",
      parts: ends.map(
        (end: SeesawEnd): IAutoMovieComposition =>
          sit(end).registered("seesawRide", {
            on: "beam",
            seat: `${end}Seat`,
            hands: { left: `${end}LeftHandle`, right: `${end}RightHandle` },
            duration: settle + 7 - seated,
          }).node,
      ),
    },
  });
  playgroundTake.clean("seesaw", film, failures);
  ends.forEach((end: SeesawEnd, index: number): void => {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(keys[index]!);
    const riding: IAutoMovieMotionHumanSegment = film
      .segments(end)
      .find(
        (segment: IAutoMovieMotionHumanSegment): boolean =>
          segment.name === "seesawRide",
      )!;
    const settled: number = riding.start + 0.6;
    const hips0: IAutoMovieVector3 = playgroundTake.local(
      beamAt(settled),
      playgroundTake.joint(film, "hips", settled, end),
    );
    let lowFeet: number = 0;
    let lowestSole: number = Infinity;
    let lowestSeat: number = Infinity;
    for (
      let at: number = settled;
      at <= riding.start + riding.plan.duration;
      at += 0.05
    ) {
      const drift: number = Vector3.distance(
        playgroundTake.local(
          beamAt(at),
          playgroundTake.joint(film, "hips", at, end),
        ),
        hips0,
      );
      if (drift > playgroundTake.HOLD)
        failures.push(
          `${end}: the pelvis leaves the seat by ${drift.toFixed(3)} m at ${at.toFixed(2)} s`,
        );
      const seatHeight: number = film.bones(end, at).get("hips")!.worldPosition
        .y;
      const reach: number =
        body.measure.shank +
        body.measure.ankleHeight +
        body.measure.hipHeight * 0.2;
      for (const side of playgroundTake.SIDES) {
        const sole: number =
          playgroundTake.joint(film, `${side}Foot`, at, end).y -
          body.measure.ankleHeight;
        lowestSole = Math.min(lowestSole, sole);
        lowestSeat = Math.min(lowestSeat, seatHeight);
        if (sole < playgroundTake.HOLD) {
          lowFeet += 1;
          if (seatHeight > reach)
            failures.push(
              `${end}: the ${side} foot is on the ground with the seat high at ${at.toFixed(2)} s`,
            );
        }
      }
    }
    if (lowFeet === 0)
      failures.push(
        `${end}: lowest sole ${lowestSole.toFixed(3)} m, lowest pelvis ${lowestSeat.toFixed(3)} m`,
      );
    if (lowFeet === 0)
      failures.push(`${end}: the feet never reach the ground at the low end`);
  });
}

/** Which end of the seesaw a rider sits on. */
type SeesawEnd = "front" | "rear";
