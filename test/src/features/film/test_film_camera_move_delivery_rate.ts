import { performShot, stageScene } from "@automovie/engine";
import {
  type IAutoMoviePerformShotProps,
  type IAutoMoviePerformedShot,
  IAutoMovieSkeleton,
  type IAutoMovieStagedSet,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import {
  makePerformanceWrite,
  makeScriptWrite,
  makeStagingWrite,
  validSynthesizer,
} from "../internal/filmFixtures";
import { createSkeleton } from "../internal/fixtures";
import { hasViolation, nclose } from "../internal/predicates";

/**
 * Pins that `performShot` keys a moving camera at the delivery clock its frame
 * format states.
 *
 * Scenarios:
 *
 * 1. A two-second push-in delivered at 30 fps is keyed at the 61 instants `k /
 *    30`.
 * 2. Delivered at the exact rate 30000/1001, its keys sit at `k × 1001 / 30000`,
 *    the render frame sampler's instants.
 * 3. A frame format without `fps`, or no frame format, refuses the push-in at
 *    `$input.frameFormat.fps` instead of keying it at an assumed rate.
 * 4. A fractional `fps` of 29.97 without its exact rate is refused at
 *    `$input.frameFormat.fps`.
 * 5. A static camera needs no rate: without `fps` it compiles one key.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs a push-in shot through performShot with each frame format and reads the hero camera clip's key times or the located refusal, and a static shot without a rate. A compiler that keys a missing rate at any fixed rate, or that refuses a locked-off camera, fails.
 * @evidence contracts/development/testing.md#independent-expectations The expected instants are the delivered frame times of the stated rate over the two-second span; #4043 requires the moving path at the delivery rate, so without one the only correct outcome is a refusal; the fractional refusal follows the production rule that a decimal rate does not identify its exact fraction.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers an integer rate, an exact fractional rate, an absent rate with and without a raster, a malformed rate, and a static camera that needs none; the keyed paths themselves are owned by test_film_camera_move_continuity.
 * @evidence contracts/development/testing.md#execution-ownership A synchronous unit test through the portable performShot seam with in-memory fixtures; no renderer, process or file is involved.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the five scenarios with the frame format each performs and the keys or refusal it expects.
 */
export function test_film_camera_move_delivery_rate(): void {
  const staged: IAutoMovieStagedSet = stageScene(
    makeScriptWrite(),
    makeStagingWrite(),
  );
  if (staged.success !== true) throw new Error("staging must succeed");
  const perform: (
    frameFormat: IAutoMoviePerformShotProps["frameFormat"],
    move?: "push-in" | "static",
  ) => IAutoMoviePerformedShot = (
    frameFormat: IAutoMoviePerformShotProps["frameFormat"],
    move: "push-in" | "static" = "push-in",
  ): IAutoMoviePerformedShot =>
    performShot({
      script: makeScriptWrite(),
      staged,
      performance: makePerformanceWrite({
        draft: [
          {
            verb: "frame",
            actor: "cam-main",
            start: 0,
            duration: "auto",
            framing: "medium",
            move,
            on: { kind: "node", node: "knightA" },
          },
        ],
        revise: { review: "the camera pushes in.", final: null },
      }),
      synthesize: validSynthesizer,
      skeleton: (): IAutoMovieSkeleton => createSkeleton(),
      ...(frameFormat === undefined ? {} : { frameFormat }),
    });
  const times: (shot: IAutoMoviePerformedShot) => number[] = (
    shot: IAutoMoviePerformedShot,
  ): number[] => {
    if (shot.success !== true || shot.shot.cameraMotion === null)
      throw new Error("the push-in must compile a camera clip");
    return shot.shot.cameraMotion.tracks[0]!.times;
  };

  const thirty: number[] = times(
    perform({ width: 1920, height: 1080, fps: 30 }),
  );
  TestValidator.predicate(
    "30 fps keys every delivered frame",
    thirty.length === 61 &&
      thirty.every((t: number, k: number): boolean => nclose(t, k / 30, 1e-12)),
  );

  const ntsc: number[] = times(
    perform({
      width: 1920,
      height: 1080,
      fps: 30000 / 1001,
      frameRate: { numerator: 30000, denominator: 1001 },
    }),
  );
  TestValidator.predicate(
    "an exact fractional rate keys its own frames",
    ntsc.length === 61 &&
      ntsc
        .slice(0, -1)
        .every((t: number, k: number): boolean => t === (k * 1001) / 30000) &&
      ntsc[60] === 2,
  );

  const unrated: IAutoMoviePerformedShot = perform({
    width: 1920,
    height: 1080,
  });
  const unformatted: IAutoMoviePerformedShot = perform(undefined);
  TestValidator.predicate(
    "a moving camera without a delivery rate is refused",
    unrated.success === false &&
      hasViolation(unrated, "type", "$input.frameFormat.fps") &&
      unformatted.success === false &&
      hasViolation(unformatted, "type", "$input.frameFormat.fps"),
  );

  const refused: IAutoMoviePerformedShot = perform({
    width: 1920,
    height: 1080,
    fps: 29.97,
  });
  TestValidator.predicate(
    "a decimal rate without its exact fraction is refused",
    refused.success === false &&
      hasViolation(refused, "range", "$input.frameFormat.fps"),
  );

  TestValidator.equals(
    "a static camera needs no rate",
    times(perform({ width: 1920, height: 1080 }, "static")).length,
    1,
  );
}
