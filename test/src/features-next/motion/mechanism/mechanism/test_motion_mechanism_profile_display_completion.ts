import type { IAutoMovieMotionHumanPerformance } from "@automovie/interface";
import { HumanChain, HumanPerformance } from "@automovie/motions";
import assert from "node:assert/strict";

import { motionHumanBody } from "../../../../features/internal/motionHumanBody";
import { profileHumanMotion } from "../../../../features/internal/profileHumanMotion";

/**
 * Profiling preserves the completed performance and propagates refusals at each stage.
 *
 * Scenarios:
 * 1. Profile a 50 ms standing film through two grid times and its exact endpoint.
 * 2. Refuse a missing second subject while displaying the first frame.
 * 3. Refuse a missing action before the first frame.
 * 4. Propagate a construction failure with its original identity.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the measured film and each refusal boundary.
 * @evidence contracts/development/testing.md#behavioral-verification Uses the normal selection environment, performance, pose lookup and profile output. Reads the returned film at its endpoint and checks caller-visible exceptions.
 * @evidence contracts/development/testing.md#independent-expectations The authored subject and action determine which lookups exist. A supplied construction error identifies the exact failure the caller must receive.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers completion, partial display, segment lookup and construction refusal.
 * @evidence contracts/development/testing.md#execution-ownership This portable scenario enables profiling for its own synchronous operations and restores the selection on exit.
 */
export function test_motion_mechanism_profile_display_completion(): void {
  const label: string = "profile-completion";
  const previous: string | undefined = process.env.AUTOMOVIE_PROFILE_MOTION;
  try {
    process.env.AUTOMOVIE_PROFILE_MOTION = label;
    const film: IAutoMovieMotionHumanPerformance = profileHumanMotion(
      label + "/complete",
      () =>
        new HumanPerformance({
          seed: "profile",
          performers: [
            {
              subject: "a",
              body: motionHumanBody("m-average"),
              at: { x: 0, y: 0, z: 0 },
              yaw: 0,
              proficiency: { level: "trained" },
            },
          ],
          composition: HumanChain.subject("a").stand({ hold: 0.05 }).node,
        }),
      ["a"],
    );
    assert.ok(film.pose("a", film.duration));
    assert.throws(
      () =>
        profileHumanMotion(label + "/display", () => film, ["a", "missing"]),
      /missing/,
    );
    assert.throws(
      () =>
        profileHumanMotion(label + "/segment", () => film, ["a"], "missing"),
      /no placed motion/,
    );
    const refusal: Error = new Error("refused before the first pose");
    assert.throws(
      () =>
        profileHumanMotion(
          label + "/construction",
          () => {
            throw refusal;
          },
          ["a"],
        ),
      (error: unknown): boolean => error === refusal,
    );
  } finally {
    if (previous === undefined) delete process.env.AUTOMOVIE_PROFILE_MOTION;
    else process.env.AUTOMOVIE_PROFILE_MOTION = previous;
  }
}
