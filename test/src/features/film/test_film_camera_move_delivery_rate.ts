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
import { nclose } from "../internal/predicates";

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
 * 3. A frame format without `fps` keys at the 24 fps fallback, 49 keys.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs a push-in shot through performShot with each frame format and reads the hero camera clip's key times.
 * @evidence contracts/development/testing.md#independent-expectations The expected instants are the delivered frame times of the stated rate over the two-second span.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers an integer rate, an exact fractional rate and an absent rate; the keyed paths themselves are owned by test_film_camera_move_continuity.
 * @evidence contracts/development/testing.md#execution-ownership A synchronous unit test through the portable performShot seam with in-memory fixtures; no renderer, process or file is involved.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the three scenarios with the frame format each performs and the keys it expects.
 */
export function test_film_camera_move_delivery_rate(): void {
  const staged: IAutoMovieStagedSet = stageScene(
    makeScriptWrite(),
    makeStagingWrite(),
  );
  if (staged.success !== true) throw new Error("staging must succeed");
  const perform: (
    frameFormat: IAutoMoviePerformShotProps["frameFormat"],
  ) => IAutoMoviePerformedShot = (
    frameFormat: IAutoMoviePerformShotProps["frameFormat"],
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
            move: "push-in",
            on: { kind: "node", node: "knightA" },
          },
        ],
        revise: { review: "the camera pushes in.", final: null },
      }),
      synthesize: validSynthesizer,
      skeleton: (): IAutoMovieSkeleton => createSkeleton(),
      frameFormat,
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

  TestValidator.equals(
    "no fps keys at the 24 fps fallback",
    times(perform({ width: 1920, height: 1080 })).length,
    49,
  );

}
