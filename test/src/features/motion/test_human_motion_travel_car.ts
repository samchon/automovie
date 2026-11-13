import { createCar } from "@automovie/archetypes";
import type { IAutoMovieResolvedBone } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanObject,
  HumanObstacle,
  HumanPerformance,
  HumanRefusal,
  type HumanSegment,
  HumanSignature,
  HumanTravelCar,
  type IHumanBody,
  type seated,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A person gets into a car by sitting on the seat first and swinging round
 * after, with the head ducked under the door's top: the crown never rises
 * above the opening's top while it is in the doorway or inside the car, and
 * the body ends seated facing the way the seat faces.
 *
 * Scenarios, the average man and the large man, each standing just outside
 * the driver's doorway of a mid-band sedan with the back to the seat, getting
 * into the driver's seat:
 * 1. The entry plans.
 * 2. Read ten times a second, whenever the crown is within 0.1 m outside
 *    the door's plane or inside it, the crown is no higher than the
 *    opening's top (a head under the roof's edge does not pass through it;
 *    the 0.1 m is half a head's depth, the back of a head facing out, provisional).
 * 3. At the end the seat region rests within 10 mm of the seat's height
 *    (the campaign's bound for a held contact) and the pelvis faces the
 *    seat's heading within 15 degrees (provisional).
 * 4. Refused, as `reach` refusals on `aperture`: the same door narrowed to
 *    0.2 m, narrower than any chest, and lowered to 0.5 m, which no duck
 *    of a seated head clears.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Places a real car archetype, reads its seat and its opening through the public readers, performs the entry through the public chain and reads the displayed crown, seat region and pelvis; a head through the roof's edge, a body left facing out or sitting in the air, or an impossible door accepted fails.
 * @evidence contracts/development/testing.md#independent-expectations The opening's top and the seat's height are the car's own; that a head stays under a roof's edge and a driver ends facing forward is what getting in is. Limitation: the legs' way over the sill is not read, since the first pass carries them round.
 * @evidence contracts/development/testing.md#distinguishing-cases Two statures, the taller of which must duck further, and two impossible doors on two axes.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and builds two entries and four refused plans in memory, reading a few dozen instants of each entry: two bodies, since the duck is solved for each stature.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and the 4 scenarios with their bounds.
 */
export function test_human_motion_travel_car(): void {
  const complaints: string[] = [];
  const car: HumanObject.IModel = createCar({ kind: "sedan" });
  const where: HumanObject.Placement = { at: { x: 0, y: 0, z: 0 }, yaw: 0 };
  const seat: seated.ISeat = HumanObject.seat(car, where, "driverSeat");
  const door: HumanObstacle.IAperture = HumanObstacle.apertures(
    car,
    where,
  ).find((a: HumanObstacle.IAperture): boolean => a.id === "driverAperture")!;
  const depth: number = seat.depth ?? 0.45;

  // The level direction out of the door, and the heading facing it.
  let out: IAutoMovieVector3 = { x: door.across.z, y: 0, z: -door.across.x };
  if ((seat.at.x - door.at.x) * out.x + (seat.at.z - door.at.z) * out.z > 0)
    out = { x: -out.x, y: 0, z: -out.z };
  const outward: number = (Math.atan2(out.x, out.z) * 180) / Math.PI;
  const forward: IAutoMovieVector3 = {
    x: Math.sin((seat.yaw * Math.PI) / 180),
    y: 0,
    z: Math.cos((seat.yaw * Math.PI) / 180),
  };
  const middle: IAutoMovieVector3 = {
    x: seat.at.x - (forward.x * depth) / 2,
    y: 0,
    z: seat.at.z - (forward.z * depth) / 2,
  };

  // Standing in the doorway with the back to the seat's door-side edge.
  const perform = (
    body: IHumanBody,
    through: HumanObstacle.IAperture,
  ): HumanPerformance =>
    new HumanPerformance({
      seed: "car",
      laws: [HumanTravelCar.getIn],
      performers: [
        {
          subject: "a",
          body,
          at: {
            x: middle.x + out.x * (depth / 2 + 0.25),
            y: 0,
            z: middle.z + out.z * (depth / 2 + 0.25),
          },
          yaw: outward,
          proficiency: { level: "trained" },
        },
      ],
      composition: HumanChain.subject("a").registered("getIn", {
        seat,
        through,
      }).node,
    });
  const top: number = door.at.y + door.height;
  for (const name of ["m-average", "m-large"] as const) {
    const body: IHumanBody = motionHumanBody(name);
    let performance: HumanPerformance;
    try {
      performance = perform(body, door);
    } catch (error) {
      complaints.push(
        `${name}: ${error instanceof Error ? error.message : String(error)}`,
      );
      continue;
    }
    const reader: HumanSignature.IReader = HumanSignature.of(
      performance,
      "a",
      body,
      0,
    );
    const entry: HumanSegment.ISegment = performance.segments("a")[0]!;

    // 2. The crown stays under the door's top.
    let highest: { over: number; at: number } = { over: -Infinity, at: 0 };
    for (const t of HumanSignature.times(entry.entryTime, entry.end, 10)) {
      const crown: IAutoMovieVector3 = HumanSignature.region(
        reader,
        "crown",
        t,
      );
      const beyond: number =
        (crown.x - door.at.x) * out.x + (crown.z - door.at.z) * out.z;
      if (beyond <= 0.1 && crown.y - top > highest.over)
        highest = { over: crown.y - top, at: t };
    }
    if (highest.over > 0)
      complaints.push(
        `${name}: the crown rises ${(highest.over * 1000).toFixed(1)} mm above the door's top at ${highest.at.toFixed(2)} s in the doorway, none expected`,
      );

    // 3. Seated, facing the seat's way.
    const rests: number = HumanSignature.region(reader, "seat", entry.end).y;
    if (Math.abs(rests - seat.at.y) > 0.01)
      complaints.push(
        `${name}: the seat region ends at ${rests.toFixed(3)} m, within 10 mm of the seat's ${seat.at.y.toFixed(3)} m expected`,
      );
    const hips: IAutoMovieResolvedBone = HumanSignature.bones(
      reader,
      entry.end,
    ).get("hips")!;
    const q: IAutoMovieQuaternion = hips.worldRotation;
    const heading: number =
      (Math.atan2(
        2 * (q.x * q.z + q.w * q.y),
        1 - 2 * (q.x * q.x + q.y * q.y),
      ) *
        180) /
      Math.PI;
    const off: number = ((((heading - seat.yaw) % 360) + 540) % 360) - 180;
    if (Math.abs(off) > 15)
      complaints.push(
        `${name}: the pelvis ends facing ${off.toFixed(1)} degrees off the seat's heading, within 15 expected`,
      );
  }

  // 4. Doors no one gets in by.
  const average: IHumanBody = motionHumanBody("m-average");
  for (const [label, through] of [
    ["a door narrowed to 0.2 m", { ...door, width: 0.2 }],
    ["a door lowered to 0.5 m", { ...door, height: 0.5 }],
  ] as const) {
    let thrown: unknown = null;
    try {
      perform(average, through);
    } catch (error) {
      thrown = error;
    }
    if (
      !(
        thrown instanceof HumanRefusal &&
        thrown.kind === "reach" &&
        thrown.axis === "aperture"
      )
    )
      complaints.push(
        `getting in by ${label}: expected a reach refusal on aperture, got ${thrown instanceof Error ? thrown.message : String(thrown)}`,
      );
  }
  TestValidator.equals("a person ducks into a car", complaints, []);
}
