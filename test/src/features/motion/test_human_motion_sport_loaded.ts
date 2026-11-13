import { createBarbell, createDumbbell } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  HumanChain,
  HumanObject,
  HumanPerformance,
  type HumanSegment,
  HumanSignature,
  HumanSportGym,
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
 * each wrist keeps its place along the bar from its handle within 15 mm between
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
 *    handle, and the wrist's place along the bar from its handle differs by
 *    at most 15 mm between the two instants (round the bar it may differ:
 *    a hand rolls about a bar as the arm turns, which the first green run
 *    but one showed as 18.6 mm of the wrist's travel on the small woman).
 * 2. At both instants the two handles' heights differ by at most 15 mm.
 * 3. The bar's middle is more than a fifth of the stature higher at the
 *    end than at `bottom1`.
 * 4. A dumbbell of 8 kg taken in the right hand, then one curl with it: at
 *    `down1` and at `top1` the right wrist is within 0.12 m of the grip, and
 *    the dumbbell is more than 0.15 of the stature higher at `top1` (a
 *    forearm's swing from hanging to folded, an estimate).
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds a performance through the public chain, the pick-up and the row's `load`, and reads the displayed bar and the displayed wrists; a refused load, a hand off its handle, a tilted bar or a bar left behind fails with the measure.
 * @evidence contracts/development/testing.md#independent-expectations The handles are the archetype's own contacts placed by the displayed prop frame; the bounds are the campaign's contact bound and a stated estimate of the hand; nothing is read from the law.
 * @evidence contracts/development/testing.md#distinguishing-cases Both hands, two instants at the ends of the lift's range, the bar's level and its travel, on two bodies of opposite build.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men, one barbell, one dumbbell and two films each; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States what is pinned, the bounds and which is an estimate, the scene and the 4 scenarios.
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
            load: { prop: "bar", handle: "gripRight", other: "gripLeft" },
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
      // Along the bar: a hand may roll about the bar as the arm turns,
      // which carries its wrist round the handle, but it does not slide.
      const along = (seconds: number): number =>
        Vector3.dot(
          offset(side, seconds),
          Vector3.normalize(
            Vector3.subtract(
              handle("gripLeft", seconds),
              handle("gripRight", seconds),
            ),
          ),
        );
      const slid: number = 1000 * Math.abs(along(bottom) - along(lift.end));
      if (!(slid <= 15))
        complaints.push(
          `${name}: the ${side} wrist slides ${slid.toFixed(1)} mm along the bar between the bottom and the end, 15 mm at most expected`,
        );
    }
    for (const seconds of [bottom, lift.end]) {
      const tilt: number =
        1000 *
        Math.abs(handle("gripLeft", seconds).y - handle("gripRight", seconds).y);
      if (!(tilt <= 15)) {
        // What the tilt is read against: the bar's line, and how far the
        // shown right hand is turned from the turn its goal asks.
        const line: IAutoMovieVector3 = Vector3.normalize(
          Vector3.subtract(
            handle("gripLeft", seconds),
            handle("gripRight", seconds),
          ),
        );
        const asked = film.posture("a", seconds).limbs.rightArm?.rotation;
        const shown = HumanSignature.bones(reader, seconds).get("rightHand")!
          .worldRotation;
        const off: number =
          asked === undefined
            ? Number.NaN
            : (2 *
                Math.acos(
                  Math.min(
                    1,
                    Math.abs(
                      asked.x * shown.x +
                        asked.y * shown.y +
                        asked.z * shown.z +
                        asked.w * shown.w,
                    ),
                  ),
                ) *
                180) /
              Math.PI;
        complaints.push(
          `${name}: at ${seconds.toFixed(2)} s the bar's handles differ by ${tilt.toFixed(1)} mm in height, 15 mm at most expected; the bar runs along (${line.x.toFixed(2)}, ${line.y.toFixed(2)}, ${line.z.toFixed(2)}) from the right handle to the left, and the shown right hand is ${off.toFixed(0)} degrees from the turn its goal asks`,
        );
      }
    }
    const rise: number =
      film.prop("bar", lift.end).position.y -
      film.prop("bar", bottom).position.y;
    if (!(rise > 0.2 * stature))
      complaints.push(
        `${name}: the bar rises ${rise.toFixed(3)} m from the bottom to the end, more than ${(0.2 * stature).toFixed(3)} m expected`,
      );
  }

  // 4. A dumbbell in one hand through a curl.
  const bell: ReturnType<typeof createDumbbell> = createDumbbell({ mass: 8 });
  for (const name of ["m-average", "f-small"] as const) {
    const body: IHumanBody = motionHumanBody(name);
    const stature: number = body.measure.stature;
    let film: HumanPerformance;
    try {
      film = new HumanPerformance({
        seed: "loaded",
        laws: [HumanSportGym.curl],
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
          // The dumbbell before the right hip, at its height.
          HumanObject.prop("bell", bell, {
            position: {
              x: -0.12 * stature,
              y: 0.56 * stature,
              z: 0.12 * stature,
            },
            rotation: Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 0),
          }),
        ],
        composition: HumanChain.subject("a")
          .stand({ seconds: 0.3 })
          .pickUp({ prop: "bell", handle: "grip" })
          .registered("curl", { reps: 1, load: { prop: "bell" } }).node,
      });
    } catch (error) {
      complaints.push(
        `${name}, dumbbell: ${error instanceof Error ? error.message : String(error)}`,
      );
      continue;
    }
    const curl: HumanSegment.ISegment = film
      .segments("a")
      .find((s: HumanSegment.ISegment): boolean => s.name === "curl")!;
    const at = (event: string): number =>
      curl.start +
      (curl.plan.events.find((e): boolean => e.name === event)?.share ??
        Number.NaN) *
        curl.plan.duration;
    const reader: HumanSignature.IReader = HumanSignature.of(
      film,
      "a",
      body,
      0,
    );
    for (const event of ["down1", "top1"]) {
      const frame: IHumanProp.IFrame = film.prop("bell", at(event));
      const away: number = Vector3.length(
        Vector3.subtract(
          HumanSignature.joint(reader, at(event), "rightHand"),
          Vector3.add(
            frame.position,
            Quaternion.rotateVector(
              frame.rotation,
              bell.affordance("grip").frame.translation,
            ),
          ),
        ),
      );
      if (!(away <= 0.12))
        complaints.push(
          `${name}, dumbbell: at ${event} the right wrist is ${(away * 1000).toFixed(0)} mm from the grip, 120 mm at most expected`,
        );
    }
    const lifted: number =
      film.prop("bell", at("top1")).position.y -
      film.prop("bell", at("down1")).position.y;
    if (!(lifted > 0.15 * stature))
      complaints.push(
        `${name}, dumbbell: the curl lifts the dumbbell ${lifted.toFixed(3)} m, more than ${(0.15 * stature).toFixed(3)} m expected`,
      );
  }
  TestValidator.equals("a loaded workout carries its load", complaints, []);
}
