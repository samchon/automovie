import {
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeRide,
} from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import {
  AutoMovieMotionHumanMount,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanSignature,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { archetypeCarriage } from "../../../internal/archetypeCarriage";
import { motionHumanBody } from "../../../internal/motionHumanBody";
import { qclose, vclose } from "../../../internal/predicates";

/**
 * A carriage member and its passenger retain their local frames through a
 * straight and a turn.
 *
 * Scenarios:
 *
 * 1. The rail and seat world sockets compose from member placement, local socket
 *    and moving root.
 * 2. The passenger's seat landmark stays within one centimetre of its initial
 *    seat-relative position.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Samples the published ride and the displayed passenger.
 * @evidence contracts/development/testing.md#independent-expectations Rigid transform composition and a fixed seat-relative position give independent readings.
 * @evidence contracts/development/testing.md#distinguishing-cases Uses a rail and a seat plus both straight and curved travel.
 * @evidence contracts/development/testing.md#execution-ownership Builds one assembly and one passenger performance.
 * @evidence contracts/development/common.md#meaningful-documentation Identifies both frames and their tolerances.
 */
export function test_motion_mechanism_passenger_frame(): void {
  const members = archetypeCarriage.members(7),
    car = archetypeCarriage(7);
  const ride = AutoMovieArchetypeRide.along(car, {
    start: { x: 0, z: 0, heading: 0 },
    legs: [
      { kind: "straight", length: 12 },
      { kind: "turn", radius: 15, angle: 90 },
    ],
    cruise: 3,
    acceleration: 1,
    deceleration: 1,
    at: 3,
  });
  for (const t of [0, ride.duration / 2, ride.duration]) {
    const root = ride.at(t).placement;
    for (const [id, local] of [
      [
        "bench2/seat",
        AutoMovieArchetypeFrame.compose(
          members.bench2.placement,
          members.bench2.archetype.affordance("seat").frame,
        ),
      ],
      [
        "railLeft/bar",
        AutoMovieArchetypeFrame.compose(
          members.railLeft.placement,
          members.railLeft.archetype.affordance("bar").frame,
        ),
      ],
    ] as const) {
      const actual = ride.frame(id, t),
        expect = AutoMovieArchetypeFrame.compose(root, local);
      TestValidator.predicate(
        id,
        vclose(actual.translation, expect.translation, 1e-9) &&
          qclose(actual.rotation, expect.rotation, 1e-12),
      );
    }
  }
  const placed = (time: number) => {
    const at = ride.at(time).placement;
    return { position: at.translation, rotation: at.rotation };
  };
  const seat = HumanObject.seat(car, placed(0), "bench2/seat"),
    angle = (seat.yaw * Math.PI) / 180,
    body = motionHumanBody("m-average");
  const film = new HumanPerformance({
    seed: "passenger",
    laws: [AutoMovieMotionHumanMount.rideHorse.ride],
    props: [HumanObject.prop("coach", car, placed(0), placed)],
    performers: [
      {
        subject: "passenger",
        body,
        at: {
          x: seat.at.x + 0.2 * Math.sin(angle),
          y: 0,
          z: seat.at.z + 0.2 * Math.cos(angle),
        },
        yaw: seat.yaw,
        proficiency: { level: "trained" },
      },
    ],
    composition: HumanChain.subject("passenger")
      .sit({ seat })
      .registered("ride", { on: "coach", duration: ride.duration }).node,
  });
  const reader = HumanSignature(film, "passenger", body, 0),
    segment = film.segments("passenger")[1]!;
  const relative = (t: number) => {
    const frame = ride.frame("bench2/seat", t);
    return Quaternion.rotateVector(
      Quaternion.inverse(frame.rotation),
      Vector3.subtract(
        HumanSignature.region(reader, "seat", t),
        frame.translation,
      ),
    );
  };
  const first = relative(segment.entryTime);
  for (let i = 1; i <= 8; ++i) {
    const at = segment.entryTime + ((segment.end - segment.entryTime) * i) / 8;
    TestValidator.predicate(
      "passenger remains seated in the turning coach",
      vclose(relative(at), first, 0.01),
    );
  }
}
