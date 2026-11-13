import { createCar, createDrinkware, createSeat } from "@automovie/archetypes";
import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
  HumanSignature,
  type IHumanBody,
  type seated,
  type IHumanProp,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * An action is attached to the object it uses: a person sits on the seat a
 * chair declares and takes a glass by the grip the glass declares, wherever
 * the scene puts them, with no coordinate of the object written by hand.
 *
 * The objects are archetypes, whose sat-on and held dimensions are cited in
 * their own package; this test reads only that a body ends up where the
 * object says it is met.
 *
 * Scenarios, the average man:
 * 1. A dining chair placed at a point and turned 30 degrees: the seat read
 *    for the actions lies where the chair itself places its seat contact
 *    (to the micrometre), faces 30 degrees, and has the chair's own depth
 *    and backrest height.
 * 2. Sitting on that seat ends with the body's seat region within 10 mm of
 *    the chair's seat height and the body facing within 1 degree of the
 *    chair's heading.
 * 3. A glass standing 0.9 m high within reach, given to the performance as
 *    a prop: its contacts are named points of the prop, and picking it up
 *    by its `body` grip raises it between 80 and 120 mm (the lift is the
 *    pick-up's 100 mm default).
 * 4. Refused, each listing what the object has: sitting on a mug, which
 *    declares no seat; a car with no seat named, which has three; a seat
 *    id the car lacks.
 * 5. Where the feet rest is read off the object too. A seat declared
 *    astride with three stirrups, turned 90 degrees, reads astride with the
 *    nearest stirrup of each side, placed in the world to a nanometre. A
 *    stool with a rung below its seat and a rail above it reads two rests
 *    on the rung, a quarter of its length to each side of its middle, and
 *    is not astride. A dining chair reads no rest.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Places real archetypes, builds performances through the public chain and reads the seat given to the actions, the displayed body and the prop's place; a seat read off its contact, a body beside the chair or a glass left on the table fails.
 * @evidence contracts/development/testing.md#independent-expectations Where the seat lies is the archetype's own placement of its contact, computed by that package; the seat height is the chair's drawn dimension; the lift is the action's documented default.
 * @evidence contracts/development/testing.md#distinguishing-cases A seat and a grip, a turned placement, and three ways an object cannot be sat on as asked.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man and three archetypes; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and the 4 scenarios with their bounds.
 */
export function test_human_motion_object_affordances(): void {
  const body: IHumanBody = motionHumanBody("m-average");
  const complaints: string[] = [];
  const perform = (
    composition: HumanChain,
    at: { x: number; y: number; z: number },
    yaw: number,
    props: HumanPerformance.IInput["props"] = [],
  ): HumanPerformance =>
    new HumanPerformance({
      seed: "object",
      props,
      performers: [
        { subject: "a", body, at, yaw, proficiency: { level: "trained" } },
      ],
      composition: composition.node,
    });
  const sorted = (names: readonly string[]): string[] =>
    [...names].sort((x: string, y: string): number => x.localeCompare(y));
  const refused = (build: () => unknown): unknown => {
    try {
      build();
    } catch (error) {
      return error;
    }
    return null;
  };

  // 1. The seat is where the chair says it is.
  const chair: ReturnType<typeof createSeat> = createSeat({ kind: "dining" });
  const where: { at: IAutoMovieVector3; yaw: number } = { at: { x: 0.3, y: 0, z: -0.45 }, yaw: 30 };
  const seat: seated.ISeat = HumanObject.seat(chair, where);
  const placed: IAutoMovieTransform = chair.placed("seat", {
    translation: where.at,
    rotation: Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, where.yaw),
    scale: { x: 1, y: 1, z: 1 },
  });
  const off: number = Math.hypot(
    seat.at.x - placed.translation.x,
    seat.at.y - placed.translation.y,
    seat.at.z - placed.translation.z,
  );
  if (
    off > 1e-6 ||
    Math.abs(seat.yaw - 30) > 1e-6 ||
    seat.depth !== chair.affordance("seat").depth ||
    seat.back !== chair.affordance("seat").back
  )
    complaints.push(
      `the chair's seat reads ${(off * 1000).toFixed(3)} mm from where the chair places it, facing ${seat.yaw.toFixed(2)} degrees, depth ${seat.depth} and back ${seat.back}; the chair has 30 degrees, ${chair.affordance("seat").depth} and ${chair.affordance("seat").back}`,
    );

  // 2. The body ends on it, facing its way. It starts with the ankles 0.2 m ahead of the front edge.
  const radians: number = (where.yaw * Math.PI) / 180;
  const sat: HumanPerformance = perform(
    HumanChain.subject("a").sit({ seat }),
    {
      x: seat.at.x + 0.2 * Math.sin(radians),
      y: 0,
      z: seat.at.z + 0.2 * Math.cos(radians),
    },
    where.yaw,
  );
  const end: number = sat.segments("a")[0]!.end;
  const rests: number = HumanSignature.region(
    HumanSignature.of(sat, "a", body, 0),
    "seat",
    end,
  ).y;

  // A seat contact stands at the seat's height in the chair's own space.
  const height: number = chair.affordance("seat").frame.translation.y;
  if (Math.abs(rests - height) > 0.01)
    complaints.push(
      `seated on the dining chair the seat region rests at ${rests.toFixed(3)} m, within 10 mm of the chair's ${height.toFixed(3)} m expected`,
    );
  if (Math.abs(sat.posture("a", end).yaw - where.yaw) > 1)
    complaints.push(
      `seated on a chair turned 30 degrees the body faces ${sat.posture("a", end).yaw.toFixed(1)} degrees`,
    );

  // 3. A glass taken by the grip it declares.
  const glass: ReturnType<typeof createDrinkware> = createDrinkware({ kind: "glass" });
  const prop: IHumanProp = HumanObject.prop("glass", glass, {
    at: { x: 0.15, y: 0.9, z: 0.4 },
    yaw: 0,
  });
  TestValidator.equals(
    "a prop's points are its contacts",
    sorted(Object.keys(prop.points)),
    sorted((glass.affordances ?? []).map((a): string => a.id)),
  );
  const taken: HumanPerformance = perform(
    HumanChain.subject("a").pickUp({ prop: "glass", handle: "body" }),
    { x: 0, y: 0, z: 0 },
    0,
    [prop],
  );
  const raised: number =
    taken.prop("glass", taken.duration).position.y -
    taken.prop("glass", 0).position.y;
  if (!(raised >= 0.08 && raised <= 0.12))
    complaints.push(
      `picked up by its body grip the glass rises ${(raised * 1000).toFixed(0)} mm, 80 to 120 mm expected`,
    );

  // 4. What an object does not offer.
  const car: ReturnType<typeof createCar> = createCar({ kind: "sedan" });
  const floor: { at: IAutoMovieVector3; yaw: number } = { at: { x: 0, y: 0, z: 0 }, yaw: 0 };
  for (const [label, build, lists] of [
    [
      "sitting on a mug",
      () => HumanObject.seat(createDrinkware({ kind: "mug" }), floor),
      [],
    ],
    [
      "a car with no seat named",
      () => HumanObject.seat(car, floor),
      ["driverSeat", "passengerSeat", "rearSeat"],
    ],
    [
      "a seat the car lacks",
      () => HumanObject.seat(car, floor, "jumpSeat"),
      ["driverSeat", "passengerSeat", "rearSeat"],
    ],
  ] as const) {
    const thrown: unknown = refused(build);
    if (
      !(
        thrown instanceof HumanRefusal &&
        thrown.kind === "affordance" &&
        thrown.feasible?.kind === "alternatives" &&
        sorted(thrown.feasible.values).join() === sorted(lists).join()
      )
    )
      complaints.push(
        `${label}: expected an affordance refusal listing ${lists.join(", ") || "no seat"}, got ${thrown instanceof Error ? thrown.message : String(thrown)}`,
      );
  }

  // 5. Where the feet rest, and a seat sat astride.
  const contact = (
    id: string,
    kind: IAutoMovieAffordance["kind"],
    at: IAutoMovieVector3,
    more: Partial<IAutoMovieAffordance> = {},
  ): IAutoMovieAffordance => ({
    id,
    kind,
    frame: {
      translation: at,
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      scale: { x: 1, y: 1, z: 1 },
    },
    extent: null,
    ...more,
  });
  const near = (
    got: IAutoMovieVector3 | undefined,
    expected: IAutoMovieVector3,
  ): boolean =>
    got !== undefined &&
    Math.hypot(got.x - expected.x, got.y - expected.y, got.z - expected.z) <=
      1e-9;
  const saddle: seated.ISeat = HumanObject.seat(
    {
      affordances: [
        contact("saddle", "seat", { x: 0, y: 0.9, z: 0 }, { astride: true }),
        contact("near", "stirrup", { x: 0.3, y: 0.4, z: 0.1 }),
        contact("far", "stirrup", { x: 0.6, y: 0.2, z: 0 }),
        contact("off", "stirrup", { x: -0.3, y: 0.4, z: 0.1 }),
      ],
    },
    { at: { x: 1, y: 0, z: 2 }, yaw: 90 },
  );

  // Turned 90 degrees about the world's up, the object's +X runs along the
  // world's -Z and its +Z along the world's +X.
  if (
    saddle.astride !== true ||
    !near(saddle.footrests?.left, { x: 1.1, y: 0.4, z: 1.7 }) ||
    !near(saddle.footrests?.right, { x: 1.1, y: 0.4, z: 2.3 })
  )
    complaints.push(
      `a saddle with three stirrups turned 90 degrees reads astride ${saddle.astride} and rests ${JSON.stringify(saddle.footrests)}; astride with the nearest stirrup of each side at (1.1, 0.4, 1.7) on the left and (1.1, 0.4, 2.3) on the right expected`,
    );
  const stool: seated.ISeat = HumanObject.seat(
    {
      affordances: [
        contact("top", "seat", { x: 0, y: 0.75, z: 0 }),
        contact("rail", "bar", { x: 0, y: 1.0, z: -0.2 }, { length: 0.4 }),
        contact("rung", "bar", { x: 0, y: 0.3, z: 0.15 }, { length: 0.4 }),
      ],
    },
    { at: { x: 0, y: 0, z: 0 }, yaw: 0 },
  );
  if (
    stool.astride !== undefined ||
    !near(stool.footrests?.left, { x: 0.1, y: 0.3, z: 0.15 }) ||
    !near(stool.footrests?.right, { x: -0.1, y: 0.3, z: 0.15 })
  )
    complaints.push(
      `a stool with a rung below its seat and a rail above it reads astride ${stool.astride} and rests ${JSON.stringify(stool.footrests)}; not astride with the rests a quarter of the rung's 0.4 m to each side of its middle expected`,
    );
  if (HumanObject.seat(chair, floor).footrests !== undefined)
    complaints.push(
      "a dining chair, which has nothing for the feet, reads foot rests; none expected",
    );

  TestValidator.equals("actions attach to objects", complaints, []);
}
