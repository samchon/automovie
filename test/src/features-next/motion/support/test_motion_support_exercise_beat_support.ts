import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanChain,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanChain, HumanPerformance } from "@automovie/motions";
import { HUMAN_LEXICON } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/**
 * The beat owns a box-step landing and the requested hold owns the stretch clock.
 *
 * Scenarios:
 * 1. Six counted steps close a square, with the landing foot quiet on its beat.
 * 2. A five-second neck stretch holds the same tilt as the thirty-second default.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads displayed ankles and head orientation.
 * @evidence contracts/development/testing.md#independent-expectations Uses authored beat period and hold difference.
 * @evidence contracts/development/testing.md#distinguishing-cases Alternating feet and two hold lengths isolate both clocks.
 * @evidence contracts/development/testing.md#execution-ownership Uses one prepared body with short compositions.
 * @evidence contracts/development/common.md#meaningful-documentation States the numerical landmarks.
 */
export function test_motion_support_exercise_beat_support(): void {
  const body = motionHumanBody("m-average");
  const perform = (chain: IAutoMovieMotionHumanChain) =>
    new HumanPerformance({
      seed: "exercise-clock",
      laws: HUMAN_LEXICON.sport,
      performers: [
        {
          subject: "dancer",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      composition: chain.node,
    });
  const chain = () => HumanChain.subject("dancer").stand({ hold: 0.3 });
  const period = 0.5,
    beats = 6;
  const dance = perform(
    chain()
      .registered("boxStep", { bpm: 60 / period, count: beats })
      .stand({ hold: 0.3 }),
  );
  const start = dance.segments("dancer")[1]!.start;
  const ankle = (
    side: "left" | "right",
    beat: number,
    after: number = 0,
  ): IAutoMovieVector3 =>
    dance.bones("dancer", start + beat * period + after).get(`${side}Foot`)!
      .worldPosition;
  for (let count = 1; count <= beats; count++) {
    const side = count % 2 === 0 ? "left" : "right";
    TestValidator.predicate(
      "landing foot stays on the beat",
      Vector3.length(
        Vector3.subtract(ankle(side, count), ankle(side, count, 1 / 24)),
      ) <= 0.005,
    );
  }
  const forward = Vector3.subtract(ankle("right", 1), ankle("right", 0));
  const across = Vector3.subtract(ankle("left", 2), ankle("left", 0));
  TestValidator.predicate(
    "first half covers both sides of the box",
    forward.z > 0.1 * body.measure.stature &&
      Math.abs(forward.x) <= 0.01 &&
      across.x > 0.1 * body.measure.stature &&
      Math.abs(across.z - forward.z) <= 0.01,
  );
  for (const side of ["left", "right"] as const)
    TestValidator.predicate(
      "box closes",
      Vector3.length(Vector3.subtract(ankle(side, beats), ankle(side, 0))) <=
        0.005,
    );
  const spans: number[] = [];
  for (const seconds of [undefined, 5]) {
    const stretch = perform(
      chain().stretch({
        kind: "neckSide",
        ...(seconds === undefined ? {} : { hold: seconds }),
      }),
    );
    const segment = stretch.segments("dancer")[1]!;
    spans.push(segment.plan.duration);
    const held = stretch.bones("dancer", (segment.entryTime + segment.end) / 2);
    const heading = (bone: "head" | "chest"): number => {
      const v = Quaternion.rotateVector(held.get(bone)!.worldRotation, {
        x: 0,
        y: 1,
        z: 0,
      });
      return (Math.atan2(v.x, v.y) * 180) / Math.PI;
    };
    TestValidator.predicate(
      "head tilts during the hold",
      Math.abs(heading("head") - heading("chest")) >= 20,
    );
  }
  TestValidator.predicate(
    "the default adds twenty-five seconds of hold",
    spans[0]! >= 30 && Math.abs(spans[0]! - spans[1]! - 25) <= 1e-6,
  );
}
