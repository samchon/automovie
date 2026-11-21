import {
  ArchetypeRefusal,
  createEscalator,
  createMovingWalkway,
  rideEscalator,
  rideMovingWalkway,
} from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanSegment,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanFoot,
  HumanObject,
  HumanPerformance,
  HumanSurface,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/** The two feet, each read against the support it bears on. */
const SIDES: readonly AutoMovieHumanSide[] = ["left", "right"];

/** The established planted-contact tolerance of the support tests, metres. */
const SLIP: number = 0.01;

/** The world placement of each installation: at the origin, facing `+Z`. */
const ORIGIN: IAutoMovieTransform = {
  translation: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
};

/**
 * A rider steps from a fixed landing onto a moving escalator tread, rides
 * it with a hand on the moving handrail through both transition curves,
 * climbs the moving inclined steps, and walks on a moving walkway.
 *
 * Scenarios, on the average man and the small woman:
 * 1. The rider starts on the lower landing, steps onto one horizontal
 *    tread, and rides it to the upper horizontal run. Through the lower
 *    curve, the incline and the upper curve, each ankle keeps its place in
 *    the tread's frame, the tread stays level, and the right wrist keeps its
 *    place at the handrail grip above the tread.
 * 2. Standing on an inclined tread, the rider climbs four moving steps up.
 *    Each foot's ankle is still in the moving flight's frame while planted,
 *    and the climb's world displacement is the static climb's plus the
 *    flight's travel.
 * 3. Climbing up a down escalator is refused unless the author states it.
 * 4. On a moving walkway the rider boards from the entry landing, rides
 *    still in the band's frame, and walks against the band. That walk's
 *    world path is the same walk's path on a still band plus the band's
 *    travel, so a walk at the band's speed stays in place.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the installations, bodies, supports and checked frames.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the displayed ankles and wrists against the actual tread, flight and band frames of the rides.
 * @evidence contracts/development/testing.md#independent-expectations The tread, flight and band frames come from the escalator and walkway rides, whose geometry is KONE's published EN 115-1 values. A planted contact moves with its support within the 10 mm support tolerance. A carried plan differs from the same plan on a still support by exactly the support's travel.
 * @evidence contracts/development/testing.md#distinguishing-cases Level runs and both curved transitions, a ride and a climb, with and against the running direction, a refused climb and two bodies.
 * @evidence contracts/development/testing.md#execution-ownership In-memory archetypes, rides and Human performances; no host.
 */
export function test_motion_exercise_escalator_ride(): void {
  const failures: string[] = [];
  for (const key of ["m-average", "f-small"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(key);
    escalatorRide(body, key, failures);
    escalatorClimb(body, key, failures);
    walkwayRide(body, key, failures);
  }
  const down: rideEscalator.IRide = rideEscalator(
    createEscalator({ rise: 3, width: 0.8 }),
    ORIGIN,
    "down",
  );
  let refusal: unknown;
  try {
    rideEscalator.climb(down, "up");
  } catch (error) {
    refusal = error;
  }
  if (
    !(refusal instanceof ArchetypeRefusal && refusal.axis === "climb.heading")
  )
    failures.push("climbing up a down escalator is not refused");
  if (rideEscalator.climb(down, "up", true) !== down.flight)
    failures.push("an authored climb against the steps is refused");
  TestValidator.equals("escalator and walkway support", failures, []);
}

/** Board one horizontal tread and ride it with a hand on the handrail. */
function escalatorRide(
  body: IAutoMovieMotionHumanBody,
  key: string,
  failures: string[],
): void {
  const escalator: ReturnType<typeof createEscalator> = createEscalator({
    rise: 3,
    width: 0.8,
  });
  const ride: rideEscalator.IRide = rideEscalator(escalator, ORIGIN, "up");
  const station: number = 0.2;
  const tread = (seconds: number): IAutoMovieRigidTransform =>
    rigid(ride.tread(station, seconds));
  const board: number = 1.2;
  const seconds: number =
    (ride.profile.length - ride.profile.flat / 2 - station) /
      ride.profile.speed -
    board;
  const film: HumanPerformance = new HumanPerformance({
    seed: "escalator ride",
    performers: [
      {
        subject: "a",
        body,
        at: { x: 0, y: 0, z: -0.45 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    props: [
      HumanObject.prop("escalator", escalator, rigid(ORIGIN)),
      HumanObject.prop(
        "step",
        createEscalator.tread(escalator),
        tread(0),
        tread,
      ),
    ],
    laws: [HumanSurface.boardRide],
    composition: HumanChain.subject("a")
      .walk({ to: { x: 0, y: 0, z: station }, on: { prop: "step" } })
      .registered("boardRide", {
        on: "step",
        seconds,
        hands: { right: "rightRail" },
      }).node,
  });
  const [walk, riding]: readonly IAutoMovieMotionHumanSegment[] =
    film.segments("a");
  const end: number =
    riding === undefined ? 0 : riding.start + riding.plan.duration;
  if (walk === undefined || riding === undefined) {
    failures.push(`${key}: the boarding walk and ride did not both play`);
    return;
  }
  for (const side of SIDES)
    if (film.bones("a", 0).get(`${side}Foot`)!.worldPosition.z >= 0)
      failures.push(`${key}: the ${side} foot does not start on the landing`);
  const start: number = riding.start;
  const reference: Record<AutoMovieHumanSide, IAutoMovieVector3> = {
    left: local(tread(start), ankle(film, "left", start)),
    right: local(tread(start), ankle(film, "right", start)),
  };
  const rail: IAutoMovieVector3 = local(tread(start), wrist(film, start));
  for (let i: number = 0; i <= 12; ++i) {
    const at: number = start + (end - start) * (i / 12);
    const frame: IAutoMovieRigidTransform = tread(at);
    for (const side of SIDES) {
      const drift: number = Vector3.distance(
        local(frame, ankle(film, side, at)),
        reference[side],
      );
      if (drift > SLIP)
        failures.push(
          `${key}: the ${side} ankle slips ${drift.toFixed(3)} m on the tread at ${at.toFixed(2)} s`,
        );
    }
    const hand: number = Vector3.distance(local(frame, wrist(film, at)), rail);
    if (hand > SLIP)
      failures.push(
        `${key}: the right wrist leaves the handrail grip by ${hand.toFixed(3)} m at ${at.toFixed(2)} s`,
      );
  }
  const top: IAutoMovieVector3 = tread(end).position;
  if (Math.abs(top.y - ride.profile.rise) > 1e-9)
    failures.push(`${key}: the ride does not reach the upper run`);
}

/** Climb four moving steps up the incline from an inclined tread. */
function escalatorClimb(
  body: IAutoMovieMotionHumanBody,
  key: string,
  failures: string[],
): void {
  const escalator: ReturnType<typeof createEscalator> = createEscalator({
    rise: 4,
    width: 0.8,
  });
  const ride: rideEscalator.IRide = rideEscalator(escalator, ORIGIN, "up");
  const { pitch, angle, flat, lower }: createEscalator.IProfile = ride.profile;
  const station: number = flat + lower * angle + 2 * pitch;
  const floor: IAutoMovieVector3 = createEscalator.station(
    ride.profile,
    station,
  );
  const flight: ReturnType<typeof rideEscalator.climb> = rideEscalator.climb(
    ride,
    "up",
  );
  const nosing: number = floor.z + (pitch * Math.cos(angle)) / 2;
  // The toes' reach along +Z on the entered stance sets the first nosing's distance.
  const standing: HumanPerformance = new HumanPerformance({
    seed: "escalator climb",
    performers: [
      {
        subject: "a",
        body,
        at: { ...floor, z: floor.z - 0.02 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    composition: HumanChain.subject("a").stand({ seconds: 0.1 }).node,
  });
  const toes: number = Math.max(
    ...SIDES.map((side: AutoMovieHumanSide): number => {
      const foot: IAutoMovieResolvedBone = standing
        .bones("a", 0)
        .get(`${side}Foot`)!;
      return HumanFoot.point(body, side, "toe", {
        ankle: foot.worldPosition,
        rotation: foot.worldRotation,
      }).z;
    }),
  );
  const perform = (moving: boolean): HumanPerformance =>
    new HumanPerformance({
      seed: "escalator climb",
      performers: [
        {
          subject: "a",
          body,
          at: { ...floor, z: floor.z - 0.02 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      props: [
        moving
          ? HumanObject.prop(
              "flight",
              escalator,
              rigid(flight(0)),
              (seconds: number): IAutoMovieRigidTransform =>
                rigid(flight(seconds)),
            )
          : HumanObject.prop("flight", escalator, rigid(flight(0))),
      ],
      composition: HumanChain.subject("a").climbStairs({
        count: 4,
        riser: pitch * Math.sin(angle),
        tread: pitch * Math.cos(angle),
        start: Math.max(0.01, nosing - toes),
        on: "flight",
      }).node,
    });
  const moving: HumanPerformance = perform(true);
  const still: HumanPerformance = perform(false);
  const climb: IAutoMovieMotionHumanSegment = moving.segments("a")[0]!;
  for (let i: number = 1; i < 12; ++i) {
    const at: number = climb.start + (climb.plan.duration * i) / 12;
    const travel: IAutoMovieVector3 = Vector3.subtract(
      rigid(flight(at)).position,
      rigid(flight(0)).position,
    );
    for (const side of SIDES) {
      const offset: number = Vector3.distance(
        Vector3.subtract(ankle(moving, side, at), travel),
        ankle(still, side, at),
      );
      if (offset > SLIP)
        failures.push(
          `${key}: the ${side} ankle on the moving flight is ${offset.toFixed(3)} m off the carried climb at ${at.toFixed(2)} s`,
        );
    }
  }
  for (const window of climb.plan.contacts)
    if (window.kind === "plant") {
      const from: number = climb.start + window.from * climb.plan.duration;
      const to: number = climb.start + window.to * climb.plan.duration;
      const side: AutoMovieHumanSide = window.part.startsWith("left")
        ? "left"
        : "right";
      const drift: number = Vector3.distance(
        local(rigid(flight(from)), ankle(moving, side, from)),
        local(rigid(flight(to)), ankle(moving, side, to)),
      );
      if (drift > SLIP)
        failures.push(
          `${key}: the planted ${side} ankle slips ${drift.toFixed(3)} m on the moving steps`,
        );
    }
}

/** Board a moving walkway, ride it and walk against its band. */
function walkwayRide(
  body: IAutoMovieMotionHumanBody,
  key: string,
  failures: string[],
): void {
  const walkway: ReturnType<typeof createMovingWalkway> = createMovingWalkway({
    length: 12,
    width: 1,
  });
  const ride: rideMovingWalkway.IRide = rideMovingWalkway(walkway, ORIGIN, {
    speed: 0.65,
  });
  const band = (seconds: number): IAutoMovieRigidTransform =>
    rigid(ride.belt(seconds));
  // The walk against the band is aimed at the same band-local point in
  // both takes: on the moving band its world target at the walk's start
  // has travelled with the band.
  const perform = (moving: boolean, shift: number): HumanPerformance =>
    new HumanPerformance({
      seed: "walkway",
      performers: [
        {
          subject: "a",
          body,
          at: { x: 0, y: 0, z: -0.45 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      props: [
        moving
          ? HumanObject.prop(
              "band",
              createMovingWalkway.belt(walkway),
              band(0),
              band,
            )
          : HumanObject.prop(
              "band",
              createMovingWalkway.belt(walkway),
              band(0),
            ),
      ],
      composition: HumanChain.subject("a")
        .walk({ to: { x: 0, y: 0, z: 0.6 }, on: { prop: "band" } })
        .stand({ seconds: 1.5, on: { prop: "band" } })
        .walk({
          to: { x: 0, y: 0, z: 0.1 + shift },
          face: 180,
          on: { prop: "band" },
        }).node,
    });
  const still: HumanPerformance = perform(false, 0);
  const against: number = still.segments("a")[2]!.start;
  const moving: HumanPerformance = perform(
    true,
    band(against).position.z - band(0).position.z,
  );
  const standing: IAutoMovieMotionHumanSegment | undefined =
    moving.segments("a")[1];
  const settled: number = standing!.start + standing!.plan.duration;
  for (const side of SIDES) {
    const first: IAutoMovieVector3 = local(
      band(standing!.start),
      ankle(moving, side, standing!.start),
    );
    const last: IAutoMovieVector3 = local(
      band(settled),
      ankle(moving, side, settled),
    );
    if (Vector3.distance(first, last) > SLIP)
      failures.push(`${key}: the ${side} ankle slips on the riding band`);
  }
  const span: number = Math.min(moving.duration, still.duration);
  for (let i: number = 1; i <= 10; ++i) {
    const at: number = (span * i) / 10;
    const travel: number = band(at).position.z - band(0).position.z;
    const hips: number =
      moving.bones("a", at).get("hips")!.worldPosition.z -
      travel -
      still.bones("a", at).get("hips")!.worldPosition.z;
    if (Math.abs(hips) > SLIP)
      failures.push(
        `${key}: the walkway rider is ${hips.toFixed(3)} m off the carried path at ${at.toFixed(2)} s`,
      );
  }
}

/** A world transform in the rigid form a prop takes. */
function rigid(transform: IAutoMovieTransform): IAutoMovieRigidTransform {
  return { position: transform.translation, rotation: transform.rotation };
}

/** A world point in a support's frame. */
function local(
  frame: IAutoMovieRigidTransform,
  point: IAutoMovieVector3,
): IAutoMovieVector3 {
  return Quaternion.rotateVector(
    Quaternion.inverse(frame.rotation),
    Vector3.subtract(point, frame.position),
  );
}

/** The displayed ankle of one foot. */
function ankle(
  film: HumanPerformance,
  side: AutoMovieHumanSide,
  at: number,
): IAutoMovieVector3 {
  return film.bones("a", at).get(`${side}Foot`)!.worldPosition;
}

/** The displayed right wrist. */
function wrist(film: HumanPerformance, at: number): IAutoMovieVector3 {
  return film.bones("a", at).get("rightHand")!.worldPosition;
}
