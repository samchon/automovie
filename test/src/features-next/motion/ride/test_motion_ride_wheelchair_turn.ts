import {
  createWheelchair,
  rideWheelchair,
  wheelchairHandrimFrame,
} from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanSegment,
  IAutoMovieRigidTransform,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanRide,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanSignature,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { catalogueWheelchair } from "../../../features/internal/catalogueWheelchair";
import { collectTakeClean } from "../../../features/internal/collectTakeClean";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { nclose } from "../../../features/internal/nclose";
import { vclose } from "../../../features/internal/vclose";

/**
 * A unilateral push keeps the free arm available while the wheelchair
 * turns its rear wheels at different rates.
 *
 * Scenarios:
 * 1. A left arc produces the independently computed inner and outer
 *    wheel travel around the axle midpoint.
 * 2. The left wrist follows its material point within the palm's span
 *    and only the left hand owns a grip during catch through release.
 *    The left wrist returns within 10 mm of its seated rest after release.
 *    The right wrist stays within the same bound throughout.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the actual turn, active side, free arm, and visible metrics.
 * @evidence contracts/development/testing.md#behavioral-verification Reads archetype wheel articulation and displayed wrists before the push, during the turn and after release.
 * @evidence contracts/development/testing.md#independent-expectations The two axle ends trace concentric arcs. Rest comes from the unmodified seated performer; the material point is the separately posed rim site.
 * @evidence contracts/development/testing.md#distinguishing-cases Left and right rear travel differ, and the actively propelling hand has different ownership and recovery from the passive hand.
 * @evidence contracts/development/testing.md#execution-ownership One seeded production wheelchair and one average Human in memory, with a seat-only entry for the rest reference.
 */
export function test_motion_ride_wheelchair_turn(): void {
  const failures: string[] = [];
  for (const key of BODIES)
    try {
      take(key, failures);
    } catch (error) {
      failures.push(
        `${key}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  TestValidator.equals("wheelchair turn", failures, []);
}

/** The two canonical bodies. */
const BODIES: readonly BodyKey[] = ["m-average", "f-small"];

/** A canonical body's key. */
type BodyKey = "m-average" | "f-small";

/**
 * The take on one body, its verdicts recorded.
 *
 * @param key The body.
 * @param failures Where a verdict fault is recorded.
 */
function take(key: BodyKey, failures: string[]): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody(key);
  // The chair fitted to the rider: the narrowest read seat that holds its
  // hips, so the rims lie within its arms.
  const chair: ReturnType<typeof createWheelchair> = catalogueWheelchair(
    body,
    "selfPropelled",
    2,
  );
  const radius: number = 2;
  const wheel: number = chair.dimensions.wheelDiameter! / 2;
  const approach: number = 0.45;
  const push: number = 0.42;
  const recovery: number = 0.7;
  const cruise: number = (wheel * Math.PI) / 6 / push;
  const turn: ReturnType<typeof rideWheelchair> = rideWheelchair(chair, {
    start: { x: 2, z: -1, heading: 63 },
    legs: [{ kind: "turn", radius, angle: 35 }],
    cruise,
    acceleration: cruise / 0.1,
    deceleration: cruise / 0.2,
  });
  const atCatch: number = 0.3;
  const turning: ReturnType<typeof turn.at> = turn.at(atCatch + push);
  const left: number = chair.affordance("leftSpin").frame.translation.x;
  const right: number = chair.affordance("rightSpin").frame.translation.x;
  const arc: number = turning.course.distance / radius;
  const degrees: number = 180 / (Math.PI * wheel);
  TestValidator.predicate(
    "the inner and outer wheels roll different distances on the arc",
    nclose(
      turning.archetype.travel("leftSpin"),
      (radius - left) * arc * degrees,
      1e-6,
    ) &&
      nclose(
        turning.archetype.travel("rightSpin"),
        (radius - right) * arc * degrees,
        1e-6,
      ),
  );

  const original: IAutoMovieTransform = turn.at(0).placement;
  const origin: IAutoMovieRigidTransform = {
    position: original.translation,
    rotation: original.rotation,
  };
  const seat: ReturnType<typeof HumanObject.seat> = HumanObject.seat(
    chair,
    origin,
  );
  const ahead: IAutoMovieVector3 = Quaternion.rotateVector(origin.rotation, {
    x: 0,
    y: 0,
    z: 0.2,
  });
  const performer: ConstructorParameters<
    typeof HumanPerformance
  >[0]["performers"][number] = {
    subject: "player",
    body,
    at: { x: seat.at.x + ahead.x, y: 0, z: seat.at.z + ahead.z },
    yaw: seat.yaw,
    proficiency: { level: "trained" },
  };
  const sitting: ReturnType<typeof HumanChain.subject> = HumanChain.subject(
    "player",
  ).sit({ seat });
  const rest: HumanPerformance = new HumanPerformance({
    seed: "chair-turn",
    performers: [performer],
    composition: sitting.node,
  });
  const begins: number = rest.duration + approach - atCatch;
  const placed = (film: number): IAutoMovieRigidTransform => {
    const frame: IAutoMovieTransform = turn.at(film - begins).placement;
    return { position: frame.translation, rotation: frame.rotation };
  };
  const material: ReturnType<typeof wheelchairHandrimFrame> =
    wheelchairHandrimFrame(turn, atCatch, -15);
  const part = (id: string, film: number): IAutoMovieTransform =>
    material(id as createWheelchair.Affordance, film - begins);
  const performance: HumanPerformance = new HumanPerformance({
    seed: "chair-turn",
    performers: [performer],
    laws: [AutoMovieMotionHumanRide.handrimStroke],
    props: [HumanObject.prop("chair", chair, origin, placed, part)],
    composition: sitting.registered("handrimStroke", {
      on: "chair",
      rims: { left: "leftRim", right: "rightRim" },
      hand: "left",
      approach,
      push,
      recovery,
    }).node,
  });
  collectTakeClean(`${key} wheelchair turn performance`, performance, failures);
  const stroke: IAutoMovieMotionHumanSegment =
    performance.segments("player")[1]!;
  const catchAt: number = stroke.entryTime + approach;
  const during: number = catchAt + push / 2;
  const recovering: number = catchAt + push + recovery / 2;
  const display: ReturnType<typeof HumanSignature.of> = HumanSignature.of(
    performance,
    "player",
    body,
    seat.yaw,
  );
  const restDisplay: ReturnType<typeof HumanSignature.of> = HumanSignature.of(
    rest,
    "player",
    body,
    seat.yaw,
  );

  /** Convert a displayed world coordinate to the relevant chair placement. */
  const local = (
    frame: IAutoMovieRigidTransform,
    point: IAutoMovieVector3,
  ): IAutoMovieVector3 =>
    Quaternion.rotateVector(
      Quaternion.inverse(frame.rotation),
      Vector3.subtract(point, frame.position),
    );
  const grips: IAutoMovieMotionHumanContactWindow[] =
    stroke.plan.contacts.filter(
      (contact: IAutoMovieMotionHumanContactWindow): boolean =>
        contact.kind === "grip",
    );
  const grip: IAutoMovieMotionHumanContactWindow | undefined = grips[0];
  TestValidator.predicate(
    "only the left hand grips from catch to release",
    grips.length === 1 &&
      grip?.part === "leftHand" &&
      grip.support.kind === "prop" &&
      grip.support.subject === "chair" &&
      nclose(grip.from * stroke.plan.duration, approach, 1e-9) &&
      nclose(grip.to * stroke.plan.duration, approach + push, 1e-9),
  );
  TestValidator.predicate(
    "the left wrist follows the inner rim material during the turn",
    [catchAt, during, catchAt + push].every(
      (film: number): boolean =>
        Vector3.distance(
          HumanSignature.joint(display, film, "leftHand"),
          part("leftRim", film).translation,
        ) <=
        0.5 * body.measure.hand,
    ),
  );
  const leftAtRest: IAutoMovieVector3 = local(
    origin,
    HumanSignature.joint(restDisplay, rest.duration, "leftHand"),
  );
  const leftAtRelease: IAutoMovieVector3 = local(
    placed(catchAt + push),
    HumanSignature.joint(display, catchAt + push, "leftHand"),
  );
  const leftAtEnd: IAutoMovieVector3 = local(
    placed(stroke.end),
    HumanSignature.joint(display, stroke.end, "leftHand"),
  );
  TestValidator.predicate(
    "the left wrist leaves the rim and returns to its carried rest",
    Vector3.distance(leftAtRelease, leftAtEnd) > 0.01 &&
      vclose(leftAtEnd, leftAtRest, 0.01),
  );
  const freeAtRest: IAutoMovieVector3 = local(
    origin,
    HumanSignature.joint(restDisplay, rest.duration, "rightHand"),
  );
  TestValidator.predicate(
    "the passive right wrist is carried without taking the rim",
    [during, recovering].every((film: number): boolean =>
      vclose(
        local(placed(film), HumanSignature.joint(display, film, "rightHand")),
        freeAtRest,
        0.01,
      ),
    ),
  );
}
