import { AutoMovieEngineMotionSampling, AutoMovieEngineFilm } from "@automovie/engine";
import type { IAutoMovieActionCall } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { synthesizeLayerTestAction } from "../internal/synthesizeLayerTestAction";

/**
 * A content layer owns its joints and expression only during its active window. Root travel persists.
 *
 * Scenarios:
 * 1. A gap after walking holds its destination, with neither the departing leg nor incoming head.
 * 2. A later face and head enter together, leaving the lead-in empty when no earlier body clip exists.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Samples both the interior of an interval and the authored boundary. The three short synthetic clips give separate observation points for root carry and for release of limb and facial channels.
 * @evidence contracts/development/testing.md#independent-expectations The actions occupy seconds zero to one and three to four.
 * @evidence contracts/development/common.md#meaningful-documentation Identifies held and released channels.
 */
export function test_perform_motion_layer_window(): void {
  const actor = "hero",
    to = { kind: "node", node: "x" } as const;
  const walk: IAutoMovieActionCall = {
    verb: "locomote",
    actor,
    start: 0,
    duration: "auto",
    region: "lowerBody",
    gait: "walk",
    to,
  };
  const look: IAutoMovieActionCall = {
    verb: "lookAt",
    actor,
    to,
    start: 3,
    duration: 1,
  };
  const face: IAutoMovieActionCall = {
    verb: "emote",
    actor,
    start: 3,
    duration: 1,
    preset: "happy",
    intensity: 1,
  };
  const layered = AutoMovieEngineFilm.compilePerformance(
    [walk, look, face],
    synthesizeLayerTestAction,
  ).performances[actor]!;
  const gap = AutoMovieEngineMotionSampling.sampleMotion(layered, 2);
  TestValidator.equals(
    "no body or face inside gap",
    [gap.pose.joints.map((j) => j.bone), gap.expression],
    [[], null],
  );
  TestValidator.predicate("destination root is held", gap.pose.root !== null);
  const active = AutoMovieEngineMotionSampling.sampleMotion(layered, 3.5);
  TestValidator.predicate(
    "late head and face own the active interval",
    active.pose.joints.some((j) => j.bone === "head") &&
      active.expression !== null,
  );
  const padded = AutoMovieEngineFilm.compilePerformance([look, face], synthesizeLayerTestAction)
    .performances[actor]!;
  const prior = AutoMovieEngineMotionSampling.sampleMotion(padded, 1.5);
  TestValidator.equals(
    "unclaimed padding",
    [prior.pose.joints, prior.pose.root, prior.expression],
    [[], null, null],
  );
  TestValidator.equals(
    "full endpoint clock",
    [padded.keyframes[0]!.time, padded.duration],
    [0, 4],
  );
}
