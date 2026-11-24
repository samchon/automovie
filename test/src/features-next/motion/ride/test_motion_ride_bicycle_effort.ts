import { createBicycle, rideBicycle } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBicycleEffort,
  IAutoMovieMotionHumanBody,
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
  HumanRefusal,
  HumanSignature,
} from "@automovie/motions";
import { HumanFoot, HumanFrame } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { bicycleRiders } from "../../../features/internal/bicycleRiders";
import { collectTakeClean } from "../../../features/internal/collectTakeClean";
import { fittedBicycle } from "../../../features/internal/fittedBicycle";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { nclose } from "../../../features/internal/nclose";
import { vclose } from "../../../features/internal/vclose";

/**
 * The same cycling take reads distinct wheel and crank phase and transfers
 * from the saddle to the moving pedal and bar supports.
 *
 * Scenarios:
 * 1. In a freewheel interval, the crank holds while both wheels turn by the
 *    independently calculated rolling distance.
 * 2. A rider seated before the bicycle departs rises 40 mm above their
 *    seated position through the coast and returns within 10 mm while both
 *    pedal-ball distances and bar-relative wrists stay within 15 mm.
 * 3. A 25 mm error at either the seat or a sole refuses entry. Each
 *    accepted effort sample shares its seated ride's carrier frame.
 * 4. The small woman, whose inseam lies below the saddle band, is refused
 *    the fitted bicycle at its saddle height.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Specifies the freewheel interval, displacement, contacts and measured bounds.
 * @evidence contracts/development/testing.md#behavioral-verification Reads wheel articulation and displayed Human seat, hands and soles at ordered and repeated film seconds.
 * @evidence contracts/development/testing.md#independent-expectations The wheel travels one circumference per revolution. An authored clearance and physical contact targets provide the lift and placement witnesses.
 * @evidence contracts/development/testing.md#distinguishing-cases Wheel travel is positive during a static crank interval, and the raised and reseated positions have different saddle contacts.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances on the average man with the seeded bicycle, each take read by the shipped verdicts; the small woman is refused the fitted bicycle.
 */
export function test_motion_ride_bicycle_effort(): void {
  bicycleRiders("bicycle effort", 8, (failures: string[]): void =>
    take("m-average", failures),
  );
}

/** The riding body; the small woman is refused the bicycle, pinned by `bicycleRiders`. */
type BodyKey = "m-average";

/**
 * The effort take on one body.
 *
 * @param key The body.
 * @param failures Where a verdict fault is recorded.
 */
function take(key: BodyKey, failures: string[]): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody(key);
  const bicycle: ReturnType<typeof createBicycle> = fittedBicycle(body, 8);
  const ride: ReturnType<typeof rideBicycle> = rideBicycle(
    bicycle,
    {
      start: { x: 0, z: 0, heading: 0 },
      legs: [{ kind: "straight", length: 4 }],
      cruise: 1,
      acceleration: 1,
      deceleration: 1,
    },
    { chainring: 34, sprocket: 17, coast: [0.2, 3.7] },
  );
  const circumference: number = Math.PI * bicycle.dimensions.wheelDiameter!;
  const coastBefore: ReturnType<typeof ride.at> = ride.at(ride.plan.when(0.8));
  const coastAfter: ReturnType<typeof ride.at> = ride.at(ride.plan.when(1.5));
  TestValidator.predicate(
    "road wheels advance by circumference while coasting",
    (["frontSpin", "rearSpin"] as const).every((part): boolean =>
      nclose(
        coastAfter.archetype.travel(part) - coastBefore.archetype.travel(part),
        (0.7 / circumference) * 360,
      ),
    ) &&
      nclose(
        coastBefore.archetype.travel("crank"),
        coastAfter.archetype.travel("crank"),
      ),
  );

  const initialPlacement: IAutoMovieTransform = ride.at(0).placement;
  const origin: IAutoMovieRigidTransform = {
    position: initialPlacement.translation,
    rotation: initialPlacement.rotation,
  };
  const seat: ReturnType<typeof HumanObject.seat> = HumanObject.seat(
    bicycle,
    origin,
  );
  const start: IAutoMovieVector3 = HumanFrame.point(
    { origin: { ...seat.at, y: 0 }, yaw: seat.yaw },
    { x: 0.6, y: 0, z: -0.2 },
  );
  const actor: ReturnType<typeof HumanChain.subject> =
    HumanChain.subject("cyclist");
  const sitting: ReturnType<typeof HumanChain.subject> = actor.sit({
    seat,
    hold: 0.5,
  });
  const performer: ConstructorParameters<
    typeof HumanPerformance
  >[0]["performers"][number] = {
    subject: "cyclist",
    body,
    at: start,
    yaw: seat.yaw,
    proficiency: { level: "trained" },
  };
  const seatedFilm: HumanPerformance = new HumanPerformance({
    seed: "bicycle-effort",
    performers: [performer],
    composition: sitting.node,
  });
  const depart: number = seatedFilm.duration;
  let frameReads: number = 0;
  const at = (film: number): IAutoMovieRigidTransform => {
    ++frameReads;
    const frame: IAutoMovieTransform = ride.at(film - depart).placement;
    return { position: frame.translation, rotation: frame.rotation };
  };
  const part = (id: string, film: number): IAutoMovieTransform =>
    ride.frame(id as createBicycle.Affordance, film - depart);

  const prop: ReturnType<typeof HumanObject.prop> = HumanObject.prop(
    "bicycle",
    bicycle,
    origin,
    at,
    part,
  );
  const params: IAutoMovieMotionHumanBicycleEffort = {
    on: "bicycle",
    seat: "saddle",
    feet: { left: "leftPedal", right: "rightPedal" },
    hands: { left: "leftGrip", right: "rightGrip" },
    duration: 4,
    seatOff: 1,
    up: 1.3,
    lower: 2,
    seatOn: 2.35,
    lift: 0.04,
  };
  const performEffort = (sit: typeof sitting): HumanPerformance =>
    new HumanPerformance({
      seed: "bicycle-effort",
      performers: [performer],
      laws: [AutoMovieMotionHumanRide.bicycleEffort],
      props: [prop],
      composition: sit.registered("bicycleEffort", params).node,
    });
  const effort: HumanPerformance = performEffort(sitting);
  collectTakeClean(`${key} bicycle effort`, effort, failures);
  const segment: IAutoMovieMotionHumanSegment = effort.segments("cyclist")[1]!;
  const readsBefore: number = frameReads;
  segment.plan.posture(1.6);
  TestValidator.equals(
    "the effort samples one bicycle frame",
    frameReads - readsBefore,
    1,
  );

  const leftRest: IAutoMovieVector3 = seat.footrests!.left!;
  for (const [axis, misaligned] of [
    ["seat", { ...seat, at: { ...seat.at, x: seat.at.x + 0.025 } }],
    [
      "feet.left",
      {
        ...seat,
        footrests: {
          ...seat.footrests,
          left: { ...leftRest, x: leftRest.x + 0.025 },
        },
      },
    ],
  ] as const) {
    let refusal: unknown;
    try {
      performEffort(actor.sit({ seat: misaligned, hold: 0.5 }));
    } catch (error) {
      refusal = error;
    }
    TestValidator.predicate(
      `the effort refuses an off-target entry at ${axis}`,
      refusal instanceof HumanRefusal &&
        refusal.kind === "base" &&
        refusal.axis === axis,
    );
  }
  const reader: ReturnType<typeof HumanSignature.of> = HumanSignature.of(
    effort,
    "cyclist",
    body,
    seat.yaw,
  );

  /** World point placed in the bicycle's frame relative to its named contact. */
  const relative = (
    id: string,
    world: IAutoMovieVector3,
    film: number,
  ): IAutoMovieVector3 =>
    Quaternion.rotateVector(
      Quaternion.inverse(at(film).rotation),
      Vector3.subtract(world, part(id, film).translation),
    );
  const saddleAt = (film: number): IAutoMovieVector3 =>
    relative("saddle", HumanSignature.region(reader, "seat", film), film);
  const before: number = segment.start + 1;
  const settled: number = segment.start + 2.36;
  const stands: number = segment.start + 1.6;
  const initial: IAutoMovieVector3 = saddleAt(before);
  const raised: IAutoMovieVector3 = saddleAt(stands);
  TestValidator.predicate(
    "the pelvis lifts and reseats with no saddle teleport",
    nclose(raised.y - initial.y, 0.04, 0.01) &&
      vclose(saddleAt(settled), initial, 0.01) &&
      vclose(saddleAt(stands), raised, 1e-6),
  );
  TestValidator.predicate(
    "saddle support releases only for the effort",
    segment.plan.contacts
      .filter((contact): boolean => contact.part === "seat")
      .every(
        (window): boolean => window.to <= 1 / 4 || window.from >= 2.35 / 4,
      ) &&
      segment.plan.contacts.filter(
        (contact): boolean => contact.part === "seat",
      ).length === 2,
  );

  for (const side of ["left", "right"] as const) {
    const wrist = (film: number): IAutoMovieVector3 =>
      relative(
        `${side}Grip`,
        HumanSignature.joint(reader, film, `${side}Hand`),
        film,
      );
    const anchored: IAutoMovieVector3 = wrist(before);
    TestValidator.predicate(
      `${side} wrist and pedal stay on the moving gear`,
      [stands, before, segment.start + 2, settled].every(
        (film: number): boolean =>
          Vector3.length(anchored) <= body.measure.hand * 0.7 &&
          vclose(wrist(film), anchored, 0.015) &&
          pedalGap(side, film) <= 0.015,
      ),
    );
  }

  /** Ball of the displayed shoe relative to the bicycle's pedal tread. */
  function pedalGap(side: AutoMovieHumanSide, film: number): number {
    const sole: ReturnType<typeof HumanFoot.sockets> = HumanFoot.sockets(
      body,
      HumanSignature.bones(reader, film),
      side,
    );
    return Vector3.distance(
      sole.find((socket): boolean => socket.socket === "ball")!.point,
      part(`${side}Pedal`, film).translation,
    );
  }
}
