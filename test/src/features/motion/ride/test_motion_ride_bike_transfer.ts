import { createBicycle, rideBicycle } from "@automovie/archetypes";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanSegment,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanRide,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
  HumanSignature,
} from "@automovie/motions";
import { HumanFoot, HumanFrame } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { bicycleRiders } from "../../internal/bicycleRiders";
import { collectTakeClean } from "../../internal/collectTakeClean";
import { fittedBicycle } from "../../internal/fittedBicycle";
import { motionHumanBody } from "../../internal/motionHumanBody";
import { nclose } from "../../internal/nclose";

/**
 * A stopped triathlon transfer follows World Triathlon's complete-foot rule
 * from the ground to a real bicycle and back to the ground.
 *
 * Scenarios:
 *
 * 1. The stop mount and dismount publish legal same-clock line events, with a
 *    displayed full-sole ground plant on the correct side within 10 mm of floor
 *    height. Between them, the seat belongs to the bicycle.
 * 2. A mount line moved ahead of the athlete refuses the same starting pose with
 *    the line as the failing axis.
 * 3. The small woman, whose inseam lies below the saddle band, is refused the
 *    fitted bicycle at its saddle height.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the event rules, displayed ground tolerance and positive and adjacent refusal cases.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the whole footprint of the displayed shoe at the published ground event and part ownership at the saddle.
 * @evidence contracts/development/testing.md#independent-expectations World Triathlon §7.1(h,j) supplies line direction and the complete ground-foot requirement. The world ground plane supplies its height. Ramp and wheeling stages are outside this fixture.
 * @evidence contracts/development/testing.md#distinguishing-cases Positive line plants before and after seating contrast with a line placed just ahead of both initial footprints.
 * @evidence contracts/development/testing.md#execution-ownership In-memory typed performance with the average Human and a seeded production bicycle held at the boundary.
 */
export function test_motion_ride_bike_transfer(): void {
  bicycleRiders("bike transfer", 8, (failures: string[]): void =>
    take("m-average", failures),
  );
}

/**
 * The riding body; the small woman is refused the bicycle, pinned by
 * `bicycleRiders`.
 */
type BodyKey = "m-average";

/**
 * The take on one body, its verdicts recorded.
 *
 * @param key The body.
 * @param failures Where a verdict fault is recorded.
 */
function take(key: BodyKey, failures: string[]): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody(key);
  const bicycle: ReturnType<typeof createBicycle> = fittedBicycle(body, 8);
  const route: ReturnType<typeof rideBicycle> = rideBicycle(bicycle, {
    start: { x: 0, z: 0, heading: 0 },
    legs: [{ kind: "straight", length: 1 }],
    cruise: 0.5,
    acceleration: 1,
    deceleration: 1,
  });
  const pose: IAutoMovieTransform = route.at(0).placement;
  const where: IAutoMovieRigidTransform = {
    position: pose.translation,
    rotation: pose.rotation,
  };
  const seat: ReturnType<typeof HumanObject.seat> = HumanObject.seat(
    bicycle,
    where,
  );
  const prop: ReturnType<typeof HumanObject.prop> = HumanObject.prop(
    "bike",
    bicycle,
    where,
    (): IAutoMovieRigidTransform => where,
    (id: string): IAutoMovieTransform =>
      route.frame(id as createBicycle.Affordance, 0),
  );
  const actor: ReturnType<typeof HumanChain.subject> =
    HumanChain.subject("athlete");
  const start: IAutoMovieVector3 = HumanFrame.point(
    { origin: { ...seat.at, y: 0 }, yaw: seat.yaw },
    { x: 0.6, y: 0, z: -0.2 },
  );
  const mountLine: number = start.z - 0.4;
  const dismountLine: number = seat.at.z + 0.7;

  /** Put the same bicycle transfer beside an independently authored line. */
  const take = (mount: number): HumanPerformance =>
    new HumanPerformance({
      seed: "transition",
      laws: [AutoMovieMotionHumanRide.bikeTransfer],
      props: [prop],
      performers: [
        {
          subject: "athlete",
          body,
          at: start,
          yaw: seat.yaw,
          proficiency: { level: "trained" },
        },
      ],
      composition: actor
        .registered("bikeTransfer", {
          on: "bike",
          mode: "mount",
          line: { x: 0, z: mount, heading: 0 },
        })
        .registered("bikeTransfer", {
          on: "bike",
          mode: "dismount",
          line: { x: 0, z: dismountLine, heading: 0 },
        }).node,
    });

  const film: HumanPerformance = take(mountLine);
  collectTakeClean(`${key} bike transfer`, film, failures);
  const [mount, off]: readonly IAutoMovieMotionHumanSegment[] =
    film.segments("athlete");
  const reader: ReturnType<typeof HumanSignature> = HumanSignature(
    film,
    "athlete",
    body,
    seat.yaw,
  );
  TestValidator.predicate(
    "seating transfers to the very same bicycle",
    [mount!, off!].every((segment: IAutoMovieMotionHumanSegment): boolean =>
      segment.plan.contacts.some(
        (contact): boolean =>
          contact.part === "seat" &&
          contact.support.kind === "prop" &&
          contact.support.subject === "bike",
      ),
    ),
  );
  for (const [segment, event, line, sign] of [
    [mount!, "mountLinePlant", mountLine, 1],
    [off!, "dismountLinePlant", dismountLine, -1],
  ] as const) {
    const share: number | undefined = segment.plan.events.find(
      (candidate): boolean => candidate.name === event,
    )?.share;
    if (share === undefined)
      throw new Error(`The boundary did not publish ${event}.`);
    const time: number = segment.start + share * segment.plan.duration;
    const bones: ReturnType<typeof HumanSignature.bones> = HumanSignature.bones(
      reader,
      time,
    );
    TestValidator.predicate(
      event,
      (["left", "right"] as const).some((side): boolean => {
        const foot: IAutoMovieResolvedBone = bones.get(`${side}Foot`)!;
        return HumanFoot.sole(body, side, {
          ankle: foot.worldPosition,
          rotation: foot.worldRotation,
        }).every(
          (point: IAutoMovieVector3): boolean =>
            nclose(point.y, 0, 0.01) && (point.z - line) * sign > 0,
        );
      }),
    );
  }

  let failure: unknown;
  try {
    take(start.z + 0.3);
  } catch (error) {
    failure = error;
  }
  TestValidator.predicate(
    "a full sole must clear the mount line",
    failure instanceof HumanRefusal &&
      failure.kind === "rule" &&
      failure.axis === "line",
  );
}
