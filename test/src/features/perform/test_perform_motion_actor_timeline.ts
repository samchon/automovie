import { compilePerformance } from "@automovie/engine";
import type {
  IAutoMovieActionCall,
  IAutoMovieActionSynthesizer,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { keyframe, makeMotion, makePose } from "../internal/fixtures";

/**
 * Each addressed actor owns a clip assembled from its nonempty synthesized cycles.
 *
 * Scenarios:
 * 1. A repeated cycle followed by a gap and a single cycle retains each distinct boundary.
 * 2. A null actor result is omitted. Prototype-spelled actor ids are ordinary own keys.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads clip identities, complete key times and omissions.
 * @evidence contracts/development/testing.md#independent-expectations Two one-second cycles end at two; the last placement covers seconds three to four.
 * @evidence contracts/development/testing.md#distinguishing-cases Combines non-overlapping placements with unison and a null branch.
 * @evidence contracts/development/testing.md#execution-ownership Supplies a constant short clip through the public synthesizer.
 * @evidence contracts/development/common.md#meaningful-documentation Describes time and key ownership.
 */
export function test_perform_motion_actor_timeline(): void {
  const part = makeMotion(
    [keyframe(0, makePose([])), keyframe(1, makePose([]))],
    1,
  );
  const synth: IAutoMovieActionSynthesizer = (_, actor) =>
    actor === "silent" ? null : part;
  const wave = (
    actor: string | string[],
    start: number,
    repeat?: number,
  ): IAutoMovieActionCall => ({
    verb: "gesture",
    kind: "wave",
    actor,
    start,
    duration: 1,
    repeat,
  });
  const reserved = ["__proto__", "constructor", "toString"];
  const actors = compilePerformance(
    [wave([...reserved, "silent"], 0, 2), wave("__proto__", 3)],
    synth,
  ).performances;
  TestValidator.equals("exact exported actors", Object.keys(actors), reserved);
  TestValidator.equals(
    "ordinary table prototype",
    Object.getPrototypeOf(actors),
    Object.prototype,
  );
  for (const actor of reserved) {
    TestValidator.predicate(
      "actor owns named performance",
      Object.hasOwn(actors, actor) && actors[actor]!.id === `perform:${actor}`,
    );
    const clip = actors[actor]!;
    const expected = actor === "__proto__" ? [0, 1, 2, 3, 4] : [0, 1, 2];
    TestValidator.equals(
      "ordered cycle and placement boundaries",
      clip.keyframes.map((key) => key.time),
      expected,
    );
    TestValidator.equals(
      "duration at final key",
      clip.duration,
      expected.at(-1),
    );
  }
  TestValidator.equals(
    "empty action set",
    Object.keys(compilePerformance([], synth).performances),
    [],
  );
}
