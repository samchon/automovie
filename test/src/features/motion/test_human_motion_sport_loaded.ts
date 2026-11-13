import { createBarbell } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  HumanChain,
  HumanObject,
  HumanPerformance,
  type HumanSegment,
  HumanSignature,
  HumanSportWorkout,
  type IHumanBody,
  type IHumanProp,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A loaded workout carries its load: a barbell taken in the right hand
 * stays in both hands through a deadlift, level across the body, and rises
 * with the lift.
 *
 * The expectations are what holding a bar means and the campaign's bounds:
 * each wrist keeps its place relative to its handle within 15 mm between
 * the bottom and the top (a hand that holds does not slide along or leave
 * the bar), each wrist is within 0.12 m of its handle (a hand's length from
 * the wrist to the middle of the grip, an estimate), the two handles are
 * level within 15 mm, and the bar's middle rises by more than a fifth of
 * the stature between the bottom and the top. The bar waits on supports at
 * the hips' height, as on a rack, which the scene does not show; one film per body keeps
 * the test under a minute, since taking a prop for a use is the costly
 * part.
 *
 * Scenarios, for each of the two bodies, a men's bar with its hands 0.5 m
 * apart taken by its right handle for a use across the hand, then one
 * deadlift with it:
 * 1. At `bottom1` and at the lift's end, each wrist is within 0.12 m of its
 *    handle, and the wrist's offset from its handle differs by at most
 *    15 mm between the two instants.
 * 2. At both instants the two handles' heights differ by at most 15 mm.
 * 3. The bar's middle is more than a fifth of the stature higher at the
 *    end than at `bottom1`.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds a performance through the public chain, the pick-up and the row's `load`, and reads the displayed bar and the displayed wrists; a refused load, a hand off its handle, a tilted bar or a bar left behind fails with the measure.
 * @evidence contracts/development/testing.md#independent-expectations The handles are the archetype's own contacts placed by the displayed prop frame; the bounds are the campaign's contact bound and a stated estimate of the hand; nothing is read from the law.
 * @evidence contracts/development/testing.md#distinguishing-cases Both hands, two instants at the ends of the lift's range, the bar's level and its travel, on two bodies of opposite build.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men, one barbell and one film each; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States what is pinned, the bounds and which is an estimate, the scene and the 3 scenarios.
 */
export function test_human_motion_sport_loaded(): void {
  const bar: ReturnType<typeof createBarbell> = createBarbell({
    kind: "mens",
    grip: 0.5,
    load: 0,
  });
  const complaints: string[] = [];
  for (const name of ["m-average", "f-small"] as const) {
    const body: IHumanBody = motionHumanBody(name);
    const stature: number = body.measure.stature;
    let film: HumanPerformance;
    try {
      film = new HumanPerformance({
        seed: "loaded",
        laws: [HumanSportWorkout.deadlift],
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
          // The bar across the body before the hips, at their height: a
          // standing arm reaches no lower without a bend the pick-up does
          // not take (at 0.42 of the stature it refused, 52 mm short).
          HumanObject.prop("bar", bar, {
            position: { x: 0, y: 0.56 * stature, z: 0.12 * stature },
            rotation: Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 0),
          }),
        ],
        composition: HumanChain.subject("a")
          .stand({ seconds: 0.3 })
          .pickUp({
            prop: "bar",
            handle: "gripRight",
            use: { tip: "gripLeft", line: "square" },
          })
          .registered("deadlift", {
            reps: 1,
            load: { prop: "bar", other: "gripLeft" },
          }).node,
      });
    } catch (error) {
      complaints.push(
        `${name}: ${error instanceof Error ? error.message : String(error)}`,
      );
      continue;
    }
    const lift: HumanSegment.ISegment = film
      .segments("a")
      .find((s: HumanSegment.ISegment): boolean => s.name === "deadlift")!;
    const bottom: number =
      lift.start +
      (lift.plan.events.find((e): boolean => e.name === "bottom1")?.share ??
        Number.NaN) *
        lift.plan.duration;
    const reader: HumanSignature.IReader = HumanSignature.of(
      film,
      "a",
      body,
      0,
    );
    const handle = (
      id: "gripLeft" | "gripRight",
      seconds: number,
    ): IAutoMovieVector3 => {
      const frame: IHumanProp.IFrame = film.prop("bar", seconds);
      return Vector3.add(
        frame.position,
        Quaternion.rotateVector(
          frame.rotation,
          bar.affordance(id).frame.translation,
        ),
      );
    };
    const offset = (
      side: "left" | "right",
      seconds: number,
    ): IAutoMovieVector3 =>
      Vector3.subtract(
        HumanSignature.joint(reader, seconds, `${side}Hand`),
        handle(side === "left" ? "gripLeft" : "gripRight", seconds),
      );
    for (const side of ["left", "right"] as const) {
      for (const seconds of [bottom, lift.end]) {
        const away: number = Vector3.length(offset(side, seconds));
        if (!(away <= 0.12))
          complaints.push(
            `${name}: at ${seconds.toFixed(2)} s the ${side} wrist is ${(away * 1000).toFixed(0)} mm from its handle, 120 mm at most expected`,
          );
      }
      const slid: number =
        1000 *
        Vector3.length(
          Vector3.subtract(offset(side, bottom), offset(side, lift.end)),
        );
      if (!(slid <= 15))
        complaints.push(
          `${name}: the ${side} wrist's place on its handle differs by ${slid.toFixed(1)} mm between the bottom and the end, 15 mm at most expected`,
        );
    }
    for (const seconds of [bottom, lift.end]) {
      const tilt: number =
        1000 *
        Math.abs(handle("gripLeft", seconds).y - handle("gripRight", seconds).y);
      if (!(tilt <= 15))
        complaints.push(
          `${name}: at ${seconds.toFixed(2)} s the bar's handles differ by ${tilt.toFixed(1)} mm in height, 15 mm at most expected`,
        );
    }
    const rise: number =
      film.prop("bar", lift.end).position.y -
      film.prop("bar", bottom).position.y;
    if (!(rise > 0.2 * stature))
      complaints.push(
        `${name}: the bar rises ${rise.toFixed(3)} m from the bottom to the end, more than ${(0.2 * stature).toFixed(3)} m expected`,
      );
  }
  TestValidator.equals("a loaded workout carries its load", complaints, []);
}
