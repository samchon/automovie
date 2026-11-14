import {
  HumanChain,
  HumanObstacle,
  HumanPerformance,
  HumanRefusal,
  HumanSignature,
  HumanTravelDoor,
  type IHumanBody,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * Nobody walks through a wall: a walk whose way crosses something solid is
 * refused with the obstacle and what would pass, and a walk through a door
 * wide and high enough for the walker arrives on the other side.
 *
 * Scenarios, the average man walking 4 m straight ahead across a wall 2 m
 * ahead of him, 0.2 m thick and 2.5 m high, 4 m long:
 * 1. With no opening the walk is refused as a `reach` refusal on `path`
 *    that names the wall.
 * 2. With a door 0.9 m wide and 2.0 m high on his way the walk plans, and
 *    at its end his pelvis is beyond the wall, within 0.3 m of the place
 *    asked (a walk stops with the feet either side of its end; the 0.3 m is
 *    a provisional reading of "arrives").
 * 3. With a door 0.3 m wide on his way the walk is refused on `path` with a
 *    range whose least value is at least his chest's breadth: narrower
 *    than his shoulders.
 * 4. With a door 0.9 m wide and 1.2 m high the walk is refused on `path`
 *    with a range whose least value is at least his stature: lower than he
 *    stands.
 * 5. With the bare wall, a walk by a place 3 m to its side that goes round
 *    its end plans.
 * 6. An approach to the small woman standing 0.6 m beyond the bare wall,
 *    whose stop at a personal distance lies on his own side of it, is
 *    refused on `path` for the wall between them: nobody walks up to a
 *    person and stops across a wall from them.
 * 7. `passThrough` of the wall's door from 1.5 m off its line plans: read
 *    eight times a second, where his pelvis is nearest the wall's line it
 *    is within 0.25 m of the door's middle (the door is 0.9 m wide and his
 *    chest about half of it, so further off he would be in the jamb; the
 *    0.25 m is provisional) and it ends beyond the wall. The same law at
 *    the bare wall is refused as an `affordance` refusal on `aperture`.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Gives the performance real obstacles through its public input and walks at them through the public chain; a walk through the wall, a door that refuses a walker it fits, or a slot or a hatch that lets him through fails.
 * @evidence contracts/development/testing.md#independent-expectations That a solid stops a walker, and that a door must be as wide as the shoulders and as high as the body, is what a wall and a door are; the walker's breadth and stature are the body's own measures, read from the body and not from the walk.
 * @evidence contracts/development/testing.md#distinguishing-cases A solid, a fitting door, a narrow one, a low one and a way round, on one wall; an approach that would stop across the wall from its partner; and `passThrough` at the door and at the bare wall.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man and builds short walks and refused plans in memory, reading the pelvis eight times a second in one walk: one body, since each claim compares an opening with that body's own measures.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and the 7 scenarios with their bounds.
 */
export function test_human_motion_travel_obstacles(): void {
  const complaints: string[] = [];
  const body: IHumanBody = motionHumanBody("m-average");
  const wall = (door?: {
    width: number;
    height: number;
  }): HumanObstacle.IObstacle =>
    HumanObstacle.wall(
      "wall",
      { x: -2, y: 0, z: 2 },
      { x: 2, y: 0, z: 2 },
      0.2,
      2.5,
      door === undefined
        ? []
        : [
            {
              id: "door",
              at: { x: 0, y: 0, z: 2 },
              across: { x: 1, y: 0, z: 0 },
              width: door.width,
              height: door.height,
            },
          ],
    );
  const walk = (
    obstacle: HumanObstacle.IObstacle,
    round: boolean = false,
  ): HumanPerformance =>
    new HumanPerformance({
      seed: "obstacles",
      obstacles: [obstacle],
      performers: [
        {
          subject: "a",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      composition: HumanChain.subject("a").walk({
        to: { x: 0, y: 0, z: 4 },
        ...(round
          ? {
              via: [
                { x: 3, y: 0, z: 0.5 },
                { x: 3, y: 0, z: 3.5 },
              ],
            }
          : {}),
      }).node,
    });
  const refused = (
    label: string,
    obstacle: HumanObstacle.IObstacle,
    least?: number,
  ): void => {
    let thrown: unknown = null;
    try {
      walk(obstacle);
    } catch (error) {
      thrown = error;
    }
    if (
      !(
        thrown instanceof HumanRefusal &&
        thrown.kind === "reach" &&
        thrown.axis === "path" &&
        thrown.message.includes("wall") &&
        (least === undefined ||
          (thrown.feasible?.kind === "range" &&
            thrown.feasible.minimum !== null &&
            thrown.feasible.minimum >= least))
      )
    )
      complaints.push(
        `${label}: expected a reach refusal on path naming the wall${least === undefined ? "" : ` with at least ${least.toFixed(3)} m needed`}, got ${thrown instanceof Error ? thrown.message : String(thrown)}`,
      );
  };

  // 1, 3 and 4. A solid, a slot and a hatch.
  refused("a walk through a bare wall", wall());
  refused(
    "a walk through a 0.3 m slot",
    wall({ width: 0.3, height: 2 }),
    body.measure.chestBreadth,
  );
  refused(
    "a walk through a 1.2 m hatch",
    wall({ width: 0.9, height: 1.2 }),
    body.measure.stature,
  );

  // 2. A door that fits.
  try {
    const through: HumanPerformance = walk(wall({ width: 0.9, height: 2 }));
    const reader: HumanSignature.IReader = HumanSignature.of(
      through,
      "a",
      body,
      0,
    );
    const end: number = through.segments("a")[0]!.end;
    const z: number =
      (HumanSignature.joint(reader, end, "leftUpperLeg").z +
        HumanSignature.joint(reader, end, "rightUpperLeg").z) /
      2;
    if (Math.abs(z - 4) > 0.3)
      complaints.push(
        `a walk through a door: the pelvis ends at z ${z.toFixed(3)} m, within 0.3 m of the 4 m asked beyond the wall expected`,
      );
  } catch (error) {
    complaints.push(
      `a walk through a door that fits: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  // 5. Round the wall's end.
  try {
    walk(wall(), true);
  } catch (error) {
    complaints.push(
      `a walk round the wall: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  // 6. Nobody stops across a wall from the person they walk up to.
  let across: unknown = null;
  try {
    new HumanPerformance({
      seed: "obstacles",
      obstacles: [wall()],
      performers: [
        {
          subject: "a",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
        {
          subject: "b",
          body: motionHumanBody("f-small"),
          at: { x: 0, y: 0, z: 2.6 },
          yaw: 180,
          proficiency: { level: "trained" },
        },
      ],
      composition: HumanChain.subject("b")
        .stand({ seconds: 3 })
        .with(
          HumanChain.subject("a").approach({
            target: { kind: "person", subject: "b", region: "sternum" },
          }),
        ).node,
    });
  } catch (error) {
    across = error;
  }
  if (
    !(
      across instanceof HumanRefusal &&
      across.kind === "reach" &&
      across.axis === "path" &&
      across.message.includes("between")
    )
  )
    complaints.push(
      `an approach to a person just beyond a wall: expected a reach refusal on path for the wall between them, got ${across instanceof Error ? across.message : String(across)}`,
    );

  // 7. Through the doorway from off its line, and no doorway to go through.
  const passing = (obstacle: HumanObstacle.IObstacle): HumanPerformance =>
    new HumanPerformance({
      seed: "obstacles",
      laws: [HumanTravelDoor.passThrough],
      obstacles: [obstacle],
      performers: [
        {
          subject: "a",
          body,
          at: { x: 1.5, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      composition: HumanChain.subject("a").registered("passThrough", {
        through: "wall",
      }).node,
    });
  try {
    const through: HumanPerformance = passing(wall({ width: 0.9, height: 2 }));
    const reader: HumanSignature.IReader = HumanSignature.of(
      through,
      "a",
      body,
      0,
    );
    const end: number = through.segments("a")[0]!.end;
    const pelvis = (t: number): { x: number; z: number } => {
      const l: { x: number; z: number } = HumanSignature.joint(
        reader,
        t,
        "leftUpperLeg",
      );
      const r: { x: number; z: number } = HumanSignature.joint(
        reader,
        t,
        "rightUpperLeg",
      );
      return { x: (l.x + r.x) / 2, z: (l.z + r.z) / 2 };
    };
    let crossing: { x: number; z: number } = pelvis(0);
    for (const t of HumanSignature.times(0, end, 8)) {
      const at: { x: number; z: number } = pelvis(t);
      if (Math.abs(at.z - 2) < Math.abs(crossing.z - 2)) crossing = at;
    }
    if (Math.abs(crossing.x) > 0.25 || pelvis(end).z < 2.3)
      complaints.push(
        `passing through the door from 1.5 m off its line: the pelvis is ${crossing.x.toFixed(3)} m off the door's middle nearest the wall (z ${crossing.z.toFixed(2)} m) and ends at z ${pelvis(end).z.toFixed(3)} m; within 0.25 m and beyond 2.3 m expected`,
      );
  } catch (error) {
    complaints.push(
      `passing through the door: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  let doorless: unknown = null;
  try {
    passing(wall());
  } catch (error) {
    doorless = error;
  }
  if (
    !(
      doorless instanceof HumanRefusal &&
      doorless.kind === "affordance" &&
      doorless.axis === "aperture"
    )
  )
    complaints.push(
      `passing through a wall with no opening: expected an affordance refusal on aperture, got ${doorless instanceof Error ? doorless.message : String(doorless)}`,
    );
  TestValidator.equals("nobody walks through a wall", complaints, []);
}
