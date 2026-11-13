import {
  createBench,
  createParallelBars,
  createPullUpBar,
} from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanObject,
  HumanPerformance,
  type HumanSegment,
  HumanSignature,
  HumanSportGym,
  HumanSportWorkout,
  type IHumanBody,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A workout done on equipment bears on that equipment: a bench press lies
 * on the bench the scene has, a pull-up hangs from its bar, and a dip
 * presses on its two bars, each at the prop's own affordance and not at a
 * height computed from the body.
 *
 * The bound is the motion campaign's 15 mm contact bound where a joint is
 * put on a place (the wrists' middle on a bar's axis, which the workout's
 * first pass pins there). A body lying on a bench is read by its hip
 * joints: above the bench's top, within a fifth of the stature of it (a
 * lying trunk's half depth with room, an estimate), and within 0.3 m of the
 * top's middle on the floor plan. One film per body with the three rows,
 * each done once, keeps the test under a minute.
 *
 * Scenarios, for each of the two bodies, a bench 1.2 m ahead, a gym pull-up
 * bar 1.2 m to the left and a dip station 1.2 m to the right:
 * 1. Bench press `on` the bench's `surface`: at `lockout1` the hip joints
 *    are above the top by less than a fifth of the stature and within 0.3 m
 *    of its middle on the floor plan.
 * 2. Pull-up `on` the bar's `bar`: at `hang1` and at `top1` the wrists'
 *    middle is within 15 mm of the bar's middle.
 * 3. Dip `on` the station's `barLeft` and `barRight`: at `top1` and at
 *    `bottom1` the wrists' middle is within 15 mm of the middle between the
 *    two bars.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds a performance through the public chain with real archetypes as props and reads displayed joints against the props' own affordances; a body that ignores the prop and bears where the body's own measure would put it fails with the distance.
 * @evidence contracts/development/testing.md#independent-expectations The places are the archetypes' affordances carried by the props' placements; the bound is the campaign's and one stated estimate; nothing is read from the law.
 * @evidence contracts/development/testing.md#distinguishing-cases A lying support, a hanging one and a pressed one, each off the performer's own place so a height computed from the body cannot pass, on two bodies of opposite build.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men, three archetypes and one film each; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States what is pinned, the bounds and which is an estimate, and the 3 scenarios.
 */
export function test_human_motion_sport_supported(): void {
  const bench: ReturnType<typeof createBench> = createBench({});
  const bar: ReturnType<typeof createPullUpBar> = createPullUpBar({
    kind: "gym",
  });
  const station: ReturnType<typeof createParallelBars> = createParallelBars({
    kind: "dipStation",
  });
  const places: Readonly<Record<"bench" | "bar" | "station", IAutoMovieVector3>> =
    {
      bench: { x: 0, y: 0, z: 1.2 },
      bar: { x: 1.2, y: 0, z: 0 },
      station: { x: -1.2, y: 0, z: 0 },
    };
  const upright: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
    { x: 0, y: 1, z: 0 },
    0,
  );
  const complaints: string[] = [];
  for (const name of ["m-average", "f-small"] as const) {
    const body: IHumanBody = motionHumanBody(name);
    const stature: number = body.measure.stature;
    let film: HumanPerformance;
    try {
      film = new HumanPerformance({
        seed: "supported",
        laws: [
          HumanSportWorkout.benchPress,
          HumanSportWorkout.pullUp,
          HumanSportGym.dip,
        ],
        performers: [
          {
            subject: "a",
            body,
            at: { x: 0, y: 0, z: 0 },
            yaw: 0,
            proficiency: { level: "trained" },
          },
        ],
        props: [
          HumanObject.prop("bench", bench, {
            position: places.bench,
            rotation: upright,
          }),
          HumanObject.prop("bar", bar, {
            position: places.bar,
            rotation: upright,
          }),
          HumanObject.prop("station", station, {
            position: places.station,
            rotation: upright,
          }),
        ],
        composition: HumanChain.subject("a")
          .stand({ seconds: 0.3 })
          .registered("benchPress", {
            reps: 1,
            on: { prop: "bench", affordance: "surface" },
          })
          .stand({ seconds: 0.3 })
          .registered("pullUp", {
            reps: 1,
            on: { prop: "bar", affordance: "bar" },
          })
          .stand({ seconds: 0.3 })
          .registered("dip", {
            reps: 1,
            on: { prop: "station", affordance: "barLeft", other: "barRight" },
          }).node,
      });
    } catch (error) {
      complaints.push(
        `${name}: ${error instanceof Error ? error.message : String(error)}`,
      );
      continue;
    }
    const reader: HumanSignature.IReader = HumanSignature.of(
      film,
      "a",
      body,
      0,
    );
    const when = (row: string, event: string): number => {
      const found: HumanSegment.ISegment = film
        .segments("a")
        .find((s: HumanSegment.ISegment): boolean => s.name === row)!;
      return (
        found.start +
        (found.plan.events.find((e): boolean => e.name === event)?.share ??
          Number.NaN) *
          found.plan.duration
      );
    };
    const middle = (
      seconds: number,
      a: "leftHand" | "leftUpperLeg",
      b: "rightHand" | "rightUpperLeg",
    ): IAutoMovieVector3 =>
      Vector3.scale(
        Vector3.add(
          HumanSignature.joint(reader, seconds, a),
          HumanSignature.joint(reader, seconds, b),
        ),
        0.5,
      );
    const of = (
      prop: "bench" | "bar" | "station",
      local: IAutoMovieVector3,
    ): IAutoMovieVector3 => Vector3.add(places[prop], local);

    // 1. The bench press lies on the bench.
    const top: IAutoMovieVector3 = of(
      "bench",
      bench.affordance("surface").frame.translation,
    );
    const lain: IAutoMovieVector3 = middle(
      when("benchPress", "lockout1"),
      "leftUpperLeg",
      "rightUpperLeg",
    );
    if (!(lain.y > top.y && lain.y - top.y < 0.2 * stature))
      complaints.push(
        `${name}: on the bench the hip joints are ${(lain.y - top.y).toFixed(3)} m above its top, between 0 and ${(0.2 * stature).toFixed(3)} m expected`,
      );
    const off: number = Math.hypot(lain.x - top.x, lain.z - top.z);
    if (!(off <= 0.3))
      complaints.push(
        `${name}: on the bench the hip joints are ${off.toFixed(3)} m from its top's middle on the floor plan, 0.3 m at most expected`,
      );

    // 2 and 3. The hands bear on the bars.
    const hung: IAutoMovieVector3 = of(
      "bar",
      bar.affordance("bar").frame.translation,
    );
    const pressed: IAutoMovieVector3 = Vector3.lerp(
      of("station", station.affordance("barLeft").frame.translation),
      of("station", station.affordance("barRight").frame.translation),
      0.5,
    );
    for (const [row, event, place] of [
      ["pullUp", "hang1", hung],
      ["pullUp", "top1", hung],
      ["dip", "top1", pressed],
      ["dip", "bottom1", pressed],
    ] as const) {
      const away: number =
        1000 *
        Vector3.length(
          Vector3.subtract(
            middle(when(row, event), "leftHand", "rightHand"),
            place,
          ),
        );
      if (!(away <= 15))
        complaints.push(
          `${name}: at ${row}'s ${event} the wrists' middle is ${away.toFixed(1)} mm from its support's place, 15 mm at most expected`,
        );
    }
  }
  TestValidator.equals("a workout bears on its equipment", complaints, []);
}
