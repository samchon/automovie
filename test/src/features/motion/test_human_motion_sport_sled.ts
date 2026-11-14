import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  HumanChain,
  HumanPerformance,
  HumanSignature,
  HumanSportCarry,
  type IHumanBody,
  type IHumanProp,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A sled push (`HumanSportCarry.sledPush`): the two handles of a load ahead
 * held in both hands through a walk, the trunk leaning into it, the load
 * going where the hands go.
 *
 * The sled is a box-like prop on the floor 0.55 m ahead of the performer,
 * its two handles 0.5 m apart at 0.55 of the performer's stature; the
 * performer pushes it 3 m.
 *
 * Scenarios, on the small woman and the average man, read every quarter of
 * a second after the hands have taken the handles (`gripped`):
 * 1. The push plans.
 * 2. Each wrist lies within 0.12 m of its handle (provisional: the wrist is
 *    a hand's half length off the grip it holds).
 * 3. The line from the hips joint to the neck leans at least 15 degrees
 *    from vertical (provisional): the trunk leans into the load.
 * 4. By the end the sled has moved at least 2 m forward and its height has
 *    stayed within 10 mm of where it stood (provisional): it slides on the
 *    floor.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds the push through the public chain and reads displayed joints and the prop's frame; hands off the handles, an upright trunk or a sled left behind fails.
 * @evidence contracts/development/testing.md#independent-expectations The bounds are stated provisional and name what a push is; none is read from the law.
 * @evidence contracts/development/testing.md#distinguishing-cases Two statures.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and builds two performances; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, the stage and the 4 scenarios with their bounds.
 */
export function test_human_motion_sport_sled(): void {
  const complaints: string[] = [];
  const mm = (metres: number): string => (metres * 1000).toFixed(0);
  for (const name of ["f-small", "m-average"] as const) {
    const body: IHumanBody = motionHumanBody(name);
    const height: number = 0.55 * body.measure.stature;
    const sled: IHumanProp = {
      subject: "sled",
      frame: {
        position: { x: 0, y: 0, z: 0.55 },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
      },
      points: {},
      affordances: (["left", "right"] as const).map((id) => ({
        id,
        kind: "handle" as const,
        frame: {
          translation: { x: id === "left" ? 0.25 : -0.25, y: height, z: 0 },
          rotation: { x: 0, y: 0, z: 0, w: 1 },
          scale: { x: 1, y: 1, z: 1 },
        },
        extent: null,
      })),
    };
    let performance: HumanPerformance;
    try {
      performance = new HumanPerformance({
        seed: "sled",
        laws: [HumanSportCarry.sledPush],
        props: [sled],
        performers: [
          {
            subject: "a",
            body,
            at: { x: 0, y: 0, z: 0 },
            yaw: 0,
            proficiency: { level: "trained" },
          },
        ],
        composition: HumanChain.subject("a").registered("sledPush", {
          sled: "sled",
          to: { x: 0, y: 0, z: 3 },
        }).node,
      });
    } catch (error) {
      complaints.push(
        `${name}: expected to plan, got ${error instanceof Error ? error.message : String(error)}`,
      );
      continue;
    }
    const placed = performance.segments("a")[0]!;
    const gripped: number =
      placed.start +
      (placed.plan.events.find((e): boolean => e.name === "gripped")?.share ??
        NaN) *
        placed.plan.duration;
    const reader: HumanSignature.IReader = HumanSignature.of(
      performance,
      "a",
      body,
      0,
    );
    let off: number = 0;
    let upright: number = Infinity;
    for (
      let seconds: number = gripped + 0.05;
      seconds <= placed.end;
      seconds += 0.25
    ) {
      const frame: IHumanProp.IFrame = performance.prop("sled", seconds);
      for (const side of ["left", "right"] as const) {
        const handle: IAutoMovieVector3 = Vector3.add(
          frame.position,
          Quaternion.rotateVector(
            frame.rotation,
            sled.affordances!.find((a) => a.id === side)!.frame.translation,
          ),
        );
        off = Math.max(
          off,
          Vector3.length(
            Vector3.subtract(
              HumanSignature.joint(reader, seconds, `${side}Hand`),
              handle,
            ),
          ),
        );
      }
      const hips: IAutoMovieVector3 = HumanSignature.joint(
        reader,
        seconds,
        "hips",
      );
      const neck: IAutoMovieVector3 = HumanSignature.joint(
        reader,
        seconds,
        "neck",
      );
      upright = Math.min(
        upright,
        (Math.acos(
          (neck.y - hips.y) /
            Math.hypot(neck.x - hips.x, neck.y - hips.y, neck.z - hips.z),
        ) *
          180) /
          Math.PI,
      );
    }
    if (!(off <= 0.12))
      complaints.push(
        `${name}: a wrist lies ${mm(off)} mm from its handle, within 120 mm expected`,
      );
    if (!(upright >= 15))
      complaints.push(
        `${name}: the trunk leans only ${upright.toFixed(1)} degrees from vertical, at least 15 expected`,
      );
    const end: IHumanProp.IFrame = performance.prop("sled", placed.end);
    if (!(end.position.z - 0.55 >= 2))
      complaints.push(
        `${name}: the sled moves ${mm(end.position.z - 0.55)} mm forward, at least 2000 mm expected`,
      );
    if (!(Math.abs(end.position.y) <= 0.01))
      complaints.push(
        `${name}: the sled ends ${mm(end.position.y)} mm off the height it stood at, within 10 mm expected`,
      );
  }
  TestValidator.equals("a sled push", complaints, []);
}
