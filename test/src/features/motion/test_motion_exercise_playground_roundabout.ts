import { createRoundabout, rideRoundabout } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionHumanWalkParams,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanSurface,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";
import { playgroundTake } from "../internal/playgroundTake";

/**
 * A pusher runs a roundabout round by its grab bar, steps on and rides it
 * (#3989).
 *
 * Scenarios, on the average man and the small woman:
 * 1. The pusher's hand stays on the turning grab bar while walking round.
 * 2. After stepping on, the feet stay still in the disc's frame.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the equipment, bodies, contacts and checked frames.
 * @evidence contracts/development/testing.md#behavioral-verification Reads displayed wrist and ankles against the actual disc frame of the ride.
 * @evidence contracts/development/testing.md#independent-expectations The disc frame comes from the ride, driven by the pusher's own angle round the spindle; contacts hold within the 20 mm ride tolerance.
 * @evidence contracts/development/testing.md#distinguishing-cases A held and a released disc, two bodies.
 * @evidence contracts/development/testing.md#execution-ownership In-memory archetypes, rides and Human performances; no host.
 */
export function test_motion_exercise_playground_roundabout(): void {
  const failures: string[] = [];
  for (const key of ["m-average", "f-small"] as const)
    roundabout(key, failures);
  TestValidator.equals("roundabout ride", failures, []);
}
/** A pusher walks a roundabout round by its bar, then steps on and rides. */
function roundabout(key: playgroundTake.BodyKey, failures: string[]): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody(key);
  const base: ReturnType<typeof createRoundabout> = createRoundabout({
    radius: 1,
    height: 0.15,
  });
  const disc: ReturnType<typeof createRoundabout.disc> =
    createRoundabout.disc(base);
  const ring: number = 1.15;
  const around = (degrees: number): IAutoMovieVector3 => ({
    x: ring * Math.sin(degrees * Quaternion.DEG2RAD),
    y: 0,
    z: ring * Math.cos(degrees * Quaternion.DEG2RAD),
  });
  const performer: playgroundTake.Performer = {
    subject: "a",
    body,
    at: around(-8),
    yaw: 90,
    proficiency: { level: "trained" as const },
  };
  const path: IAutoMovieMotionHumanWalkParams = {
    to: around(100),
    // The path follows the ring, so each step turns by little.
    via: [5, 15, 25, 35, 45, 55, 65, 75, 85].map(around),
  };

  // The disc follows the pusher: its angle is the pusher's angle round the spindle.
  const probe: HumanPerformance = new HumanPerformance({
    seed: "roundabout",
    performers: [performer],
    composition: HumanChain.subject("a").walk(path).node,
  });
  const angleOf = (seconds: number): number => {
    const hips: IAutoMovieVector3 = probe
      .bones("a", seconds)
      .get("hips")!.worldPosition;
    return Math.atan2(hips.x, hips.z) / Quaternion.DEG2RAD;
  };
  const release: number = probe.duration;
  const ride: rideRoundabout.IRide = rideRoundabout(playgroundTake.ORIGIN, {
    driven: (seconds: number): number => angleOf(seconds) - angleOf(0),
    release,
  });
  const discAt = (seconds: number): IAutoMovieRigidTransform =>
    playgroundTake.rigid(ride.disc(seconds));
  // The pusher steps on ahead and inward, onto the disc as it stands when
  // the step begins.
  const board: IAutoMovieVector3 = Quaternion.rotateVector(
    discAt(release).rotation,
    {
      x: 0.7 * Math.sin(25 * Quaternion.DEG2RAD),
      y: 0.15,
      z: 0.7 * Math.cos(25 * Quaternion.DEG2RAD),
    },
  );
  const film: HumanPerformance = new HumanPerformance({
    seed: "roundabout",
    performers: [performer],
    props: [
      HumanObject.prop(
        "base",
        base,
        playgroundTake.rigid(playgroundTake.ORIGIN),
      ),
      HumanObject.prop("disc", disc, discAt(0), discAt),
    ],
    laws: [HumanSurface.roundaboutPush, HumanSurface.supportStep],
    composition: HumanChain.subject("a")
      .registered("roundaboutPush", {
        ...path,
        on: "disc",
        bar: "bar0",
        hand: "left",
      })
      .registered("supportStep", { to: board, onto: "disc" })
      .stand({ seconds: 1.5, on: { prop: "disc" } }).node,
  });
  playgroundTake.clean(`${key} roundabout`, film, failures);
  const [push, , riding]: readonly IAutoMovieMotionHumanSegment[] =
    film.segments("a");
  if (push === undefined || riding === undefined) {
    failures.push(`${key}: the push, step-on and ride did not all play`);
    return;
  }
  const grip0: IAutoMovieVector3 = playgroundTake.local(
    discAt(push.start + 0.6),
    playgroundTake.joint(film, "leftHand", push.start + 0.6),
  );
  for (
    let at: number = push.start + 0.6;
    at <= push.start + push.plan.duration;
    at += 0.05
  ) {
    const slip: number = Vector3.distance(
      playgroundTake.local(
        discAt(at),
        playgroundTake.joint(film, "leftHand", at),
      ),
      grip0,
    );
    if (slip > 3 * playgroundTake.HOLD)
      failures.push(
        `${key}: the pushing hand leaves the bar by ${slip.toFixed(3)} m at ${at.toFixed(2)} s`,
      );
  }
  const ride0: number = riding.start + 0.1;
  for (const side of playgroundTake.SIDES) {
    const first: IAutoMovieVector3 = playgroundTake.local(
      discAt(ride0),
      playgroundTake.joint(film, `${side}Foot`, ride0),
    );
    const last: IAutoMovieVector3 = playgroundTake.local(
      discAt(riding.start + riding.plan.duration),
      playgroundTake.joint(
        film,
        `${side}Foot`,
        riding.start + riding.plan.duration,
      ),
    );
    if (Vector3.distance(first, last) > playgroundTake.HOLD)
      failures.push(`${key}: the ${side} foot slips on the turning disc`);
  }
}
