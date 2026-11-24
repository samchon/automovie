import { createHorse, rideHorse } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanSignature,
  IAutoMovieRigidTransform,
  IAutoMovieScheduleCue,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanMount,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanSignature,
} from "@automovie/motions";
import { HumanFoot, HumanFrame } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";

type Ride = ReturnType<typeof rideHorse>;

/** Seconds the rider sits on the standing horse before its course starts, as the equestrian exercise does. */
const WAIT: number = 6;

/** The rider attachment campaign's contact drift bound, metres. */
const CONTACT: number = 0.01;

/**
 * A rider keeps seat, stirrups and reins through a leg-yield and across the cut back to straight trot.
 *
 * Scenarios:
 * 1. The horse trots straight, leg-yields toward the left at 30 degrees and recovers to straight travel; the rider sits the trot on the horse's own left fore track with both feet on the stirrups and both hands on the reins.
 * 2. Seat, stirrup and rein contacts read in the tack's current frames stay within 10 mm of their values at the last straight touchdown before the figure, at every left fore touchdown through the figure and across the cut back to straight travel.
 * 3. The saddle itself turns off the travel during the figure and back after it, so the contacts are read on a body that actually changed heading.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the horse course, the cue track, the contacts read and the times.
 * @evidence contracts/development/testing.md#behavioral-verification Reads displayed rider joints, seat region and foot sockets against the horse's published seat, stirrup and rein frames.
 * @evidence contracts/development/testing.md#independent-expectations The 10 mm bound is the rider attachment contract's; the cut time is the horse's published figure end; the heading change is read from the displayed saddle and root travel.
 * @evidence contracts/development/testing.md#distinguishing-cases Straight entry, held figure and recovery, both sides' feet and hands. Mirroring and the horse's figure geometry are owned by test_archetype_equine_dressage.
 * @evidence contracts/development/testing.md#execution-ownership A memory-only HumanPerformance with one generated polygon man and one native horse ride.
 */
export function test_motion_dress_equestrian_dressage(): void {
  const horse: ReturnType<typeof createHorse> = createHorse({
    withersHeight: 1.72,
    tempo: 0,
  });
  const ride: Ride = rideHorse(horse, {
    start: { x: 0, z: 0, heading: 0 },
    cruise: 2.3,
    startSpeed: 2.3,
    endSpeed: 2.3,
    legs: [
      { kind: "straight", length: 6, gait: "trot" },
      {
        kind: "straight",
        length: 14,
        gait: "trot",
        equineFootwork: {
          kind: "leg-yield",
          toward: "left",
          angle: 30,
          blend: 0.8,
        },
      },
      { kind: "straight", length: 8, gait: "trot" },
    ],
  });
  const begin: number = WAIT + cue(ride, "leg-yieldStart");
  const cut: number = WAIT + cue(ride, "leg-yieldEnd");
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const seconds = (at: number): number => Math.max(0, at - WAIT);
  const place = (at: number): IAutoMovieRigidTransform => {
    const frame: IAutoMovieTransform = ride.at(seconds(at)).placement;
    return { position: frame.translation, rotation: frame.rotation };
  };
  const part = (id: string, at: number): IAutoMovieTransform =>
    ride.frame(id as Parameters<Ride["frame"]>[0], seconds(at));
  const strides: readonly IAutoMovieScheduleCue[] = ride.instants
    .filter((event): boolean => event.label === "leftForeOn")
    .map(
      (event): IAutoMovieScheduleCue => ({
        name: "trot",
        seconds: WAIT + event.seconds,
      }),
    );
  const seat = HumanObject.seat(ride.at(0).archetype, place(0));
  const film: HumanPerformance = new HumanPerformance({
    seed: "equine-dressage",
    cues: { trot: strides },
    props: [HumanObject.prop("horse", horse, place(0), place, part)],
    laws: [AutoMovieMotionHumanMount.rideHorse.ride],
    performers: [
      {
        subject: "rider",
        body,
        at: HumanFrame.point(
          { origin: { ...seat.at, y: 0 }, yaw: seat.yaw },
          { x: 0.6, y: 0, z: -0.2 },
        ),
        yaw: seat.yaw,
        proficiency: { level: "trained" },
      },
    ],
    composition: HumanChain.subject("rider")
      .sit({ seat, hold: 0.5 })
      .registered("ride", {
        on: "horse",
        duration: WAIT + ride.duration - 0.5,
        seat: "seat",
        feet: { left: "leftStirrup", right: "rightStirrup" },
        hands: { left: "leftRein", right: "rightRein" },
        equestrian: { stride: { cue: "trot", gait: "trot" } },
      }).node,
  });
  const reader: IAutoMovieMotionHumanSignature.IReader = HumanSignature.of(
    film,
    "rider",
    body,
    0,
  );
  // The rider's gait response is periodic in the stride, so contacts are compared at the same hoof event: every left fore touchdown from the straight entry through the figure and the cut to straight travel.
  const touchdowns: readonly number[] = strides
    .map((event: IAutoMovieScheduleCue): number => event.seconds)
    .filter((at: number): boolean => at > begin - 1 && at < cut + 1.5);
  const baseline: number = touchdowns[0]!;
  const times: readonly number[] = touchdowns.slice(1);
  const issues: string[] = [];
  if (
    !times.some((at: number): boolean => at < cut) ||
    !times.some((at: number): boolean => at > cut)
  )
    issues.push("touchdowns must bracket the cut back to straight travel");
  for (const at of times) {
    if (Vector3.distance(seatPoint(at), seatPoint(baseline)) > CONTACT)
      issues.push(
        `seat drifts at ${at} by ${Vector3.distance(seatPoint(at), seatPoint(baseline))}`,
      );
    for (const side of ["left", "right"] as const) {
      if (Vector3.distance(ball(side, at), ball(side, baseline)) > CONTACT)
        issues.push(`${side} stirrup drifts at ${at}`);
      if (Vector3.distance(hand(side, at), hand(side, baseline)) > CONTACT)
        issues.push(`${side} rein drifts at ${at}`);
    }
  }
  const turned: number = yaw((begin + cut) / 2);
  if (!(Math.abs(turned + 30) < 1 && Math.abs(yaw(cut + 1.2)) < 1))
    issues.push(`saddle heading off travel ${turned}, after ${yaw(cut + 1.2)}`);
  assertTakeClean("the lateral figure under the rider", film);
  TestValidator.equals("rider contacts through the lateral figure", issues, []);

  /** The seat region in the saddle's current frame. */
  function seatPoint(at: number): IAutoMovieVector3 {
    return local(part("seat", at), HumanSignature.region(reader, "seat", at));
  }

  /** A foot's ball socket in its stirrup's current frame. */
  function ball(side: AutoMovieHumanSide, at: number): IAutoMovieVector3 {
    return local(
      part(`${side}Stirrup`, at),
      HumanFoot.sockets(body, HumanSignature.bones(reader, at), side).find(
        (socket: IAutoMovieMotionHumanFoot.ISocket): boolean =>
          socket.socket === "ball",
      )!.point,
    );
  }

  /** A wrist in its rein's current frame. */
  function hand(side: AutoMovieHumanSide, at: number): IAutoMovieVector3 {
    return local(
      part(`${side}Rein`, at),
      HumanSignature.joint(reader, at, `${side}Hand`),
    );
  }

  /** Degrees from the displayed travel to the displayed saddle heading. */
  function yaw(at: number): number {
    const facing: IAutoMovieVector3 = Quaternion.rotateVector(
      part("seat", at).rotation,
      { x: 0, y: 0, z: 1 },
    );
    const a: IAutoMovieVector3 = place(at - 0.02).position;
    const b: IAutoMovieVector3 = place(at + 0.02).position;
    const degrees: number =
      ((Math.atan2(facing.x, facing.z) - Math.atan2(b.x - a.x, b.z - a.z)) *
        180) /
      Math.PI;
    return ((degrees + 540) % 360) - 180;
  }
}

/** A published instant of the horse's ride. */
function cue(ride: Ride, label: string): number {
  const found: number | undefined = ride.instants.find(
    (event): boolean => event.label === label,
  )?.seconds;
  if (found === undefined)
    throw new Error(`The horse did not publish ${label}`);
  return found;
}

/** A world point in a frame's own axes. */
function local(
  frame: IAutoMovieTransform,
  point: IAutoMovieVector3,
): IAutoMovieVector3 {
  return Quaternion.rotateVector(
    Quaternion.inverse(frame.rotation),
    Vector3.subtract(point, frame.translation),
  );
}
