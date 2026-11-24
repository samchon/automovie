import { createLure } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanTether,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanChain, HumanObject, HumanPerformance } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../../features/internal/motionHumanBody";

/** The line out, metres. */
const LENGTH: number = 2;

/** Where the line's near end hangs, world metres. */
const ANCHOR: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };

/** The arc length bound of a drawn slack line, as a share of its length (the chords of 16 samples fall short of the arc by well under this). */
const ARC: number = 0.01;

/**
 * Lines between props (#3998).
 *
 * Scenarios, a line of 2 m from a fixed anchor 1 m up to a resting lure:
 * 1. A lure 3 m away is pulled in along the floor until the line reaches,
 *    keeping its height, and the line runs taut and straight.
 * 2. A lure 1 m away leaves the line slack: it hangs below both ends, its
 *    drawn points run the line's length, and its ends lie on the points.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the cases and the bounds.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the displayed lure and the line the performance draws; a lure left beyond the line, lifted off its rest, a taut line drawn slack, or a slack line of the wrong length or above its ends fails.
 * @evidence contracts/development/testing.md#independent-expectations A pulled line's ends lie its length apart with the lure's height kept; a catenary's arc is its length and its sag lies below its ends.
 * @evidence contracts/development/testing.md#distinguishing-cases A taut pull and a slack hang.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances through the public performance.
 */
export function test_motion_mechanism_tether(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const far: HumanPerformance = staged(body, { x: 3, y: 0, z: 0 });
  const taut: IAutoMovieMotionHumanTether.ISpan = far.tether(
    "anchor",
    "line",
    0.5,
  );
  const rest: number = staged(body, { x: 1, y: 0, z: 0 }).prop("lure", 0.5)
    .position.y;
  const reached: number = Vector3.distance(taut.from, taut.to);
  TestValidator.predicate(
    `a far lure is pulled to the line's length (${reached.toFixed(4)} m of ${LENGTH} m), keeping its height`,
    Math.abs(reached - LENGTH) <= 1e-6 &&
      Vector3.distance(taut.to, eye(far.prop("lure", 0.5))) <= 1e-9 &&
      Math.abs(far.prop("lure", 0.5).position.y - rest) <= 1e-9,
  );
  TestValidator.predicate(
    "the pulled line runs taut and straight",
    taut.taut && taut.points.length === 2,
  );

  const near: HumanPerformance = staged(body, { x: 1, y: 0, z: 0 });
  const slack: IAutoMovieMotionHumanTether.ISpan = near.tether(
    "anchor",
    "line",
    0.5,
  );
  const arc: number = slack.points
    .slice(1)
    .reduce(
      (sum: number, p: IAutoMovieVector3, i: number): number =>
        sum + Vector3.distance(slack.points[i]!, p),
      0,
    );
  const lowest: number = Math.min(
    ...slack.points.map((p: IAutoMovieVector3): number => p.y),
  );
  TestValidator.predicate(
    `a near lure leaves the line slack, hanging ${arc.toFixed(3)} m below its ends`,
    !slack.taut &&
      Math.abs(arc - LENGTH) <= ARC * LENGTH &&
      lowest < Math.min(slack.from.y, slack.to.y) &&
      Vector3.distance(slack.points[0]!, slack.from) <= 1e-9 &&
      Vector3.distance(slack.points.at(-1)!, slack.to) <= 1e-9,
  );
}

/** A standing performer, a fixed anchor with a 2 m line to a lure resting at a floor point. */
function staged(
  body: IAutoMovieMotionHumanBody,
  at: IAutoMovieVector3,
): HumanPerformance {
  const line: IAutoMovieMotionHumanTether = {
    id: "line",
    from: "eye",
    to: { prop: "lure", point: "eye" },
    length: { kind: "free", metres: LENGTH },
  };
  return new HumanPerformance({
    seed: "tether",
    props: [
      {
        ...HumanObject.prop("anchor", createLure({ id: "anchor" }), {
          at: ANCHOR,
          yaw: 0,
          fixed: true,
        }),
        tethers: [line],
      },
      HumanObject.prop("lure", createLure({ id: "lure" }), placement(at)),
    ],
    performers: [
      {
        subject: "a",
        body,
        at: { x: 0, y: 0, z: -2 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    composition: HumanChain.subject("a").stand({ hold: 1 }).node,
  });
}

/** A resting placement at a floor point. */
function placement(at: IAutoMovieVector3): IAutoMovieRigidTransform {
  return { position: at, rotation: { x: 0, y: 0, z: 0, w: 1 } };
}

/** A lure's eye at a frame. */
function eye(frame: IAutoMovieRigidTransform): IAutoMovieVector3 {
  return Vector3.add(
    frame.position,
    Quaternion.rotateVector(
      frame.rotation,
      createLure().affordance("eye").frame.translation,
    ),
  );
}
