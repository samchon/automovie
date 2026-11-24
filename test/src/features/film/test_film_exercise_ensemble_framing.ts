import { performShot, stageScene } from "@automovie/engine";
import type {
  IAutoMovieClip,
  IAutoMovieModel,
  IAutoMovieMotion,
  IAutoMoviePerformedShot,
  IAutoMovieScript,
  IAutoMovieStagedSet,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { SQUARE_FRAME_AT_24_FPS } from "../internal/SQUARE_FRAME_AT_24_FPS";
import {
  makePerformanceWrite,
  makeScriptWrite,
  makeStagingWrite,
} from "../internal/filmFixtures";
import { keyframe, makeMotion, makePose } from "../internal/fixtures";
import { nclose } from "../internal/nclose";

/**
 * A camera following an ensemble uses its active members' world positions.
 *
 * Scenarios:
 *
 * 1. A performer moves from world X 0 to 1 while their group partner stays at X 4.
 *    The wide follow camera moves half a metre with their shared centre.
 * 2. An off-centre group member rotates and scales about its stationary root in an
 *    object clip. The camera tracks the drawn centre of its box.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the cast motion, their positions, the framing action and its expected displacement.
 * @evidence contracts/development/testing.md#behavioral-verification Compiles the shot from a group target and reads the emitted camera translation keys through performShot.
 * @evidence contracts/development/testing.md#independent-expectations The two actor endpoints fix the midpoints at X 2 and X 2.5. A box centred at X 3 follows a 90-degree yaw and double scale to Z -6. A follow move retains its relative camera placement, so its emitted translation changes by the same amounts, within nclose's 1e-6 tolerance.
 * @evidence contracts/development/testing.md#distinguishing-cases A staged-only union stays fixed. A moving actor changes its group's box by half its own displacement. A transform clip can move the visible group centre while holding its root fixed.
 * @evidence contracts/development/testing.md#execution-ownership This synchronous unit stages and compiles a shot with a supplied root motion, checking numeric camera translation without a renderer.
 */
export function test_film_exercise_ensemble_framing(): void {
  const script: IAutoMovieScript = makeScriptWrite();
  const staged: IAutoMovieStagedSet = stageScene(
    script,
    makeStagingWrite({
      actors: [
        { node: "knightA", position: { x: 0, y: 0, z: 0 }, facingDeg: 0 },
        { node: "knightB", position: { x: 4, y: 0, z: 0 }, facingDeg: 0 },
      ],
    }),
  );
  if (staged.success !== true) throw new Error("staging must succeed");

  const walking: IAutoMovieMotion = makeMotion(
    [0, 1].map((x: number) =>
      keyframe(
        x,
        makePose([], {
          translation: { x, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0, w: 1 },
          scale: { x: 1, y: 1, z: 1 },
        }),
      ),
    ),
    1,
  );
  const result: IAutoMoviePerformedShot = performShot({
    frameFormat: SQUARE_FRAME_AT_24_FPS,
    script,
    staged,
    performance: makePerformanceWrite({
      duration: 1,
      draft: [
        {
          verb: "locomote",
          actor: "knightA",
          start: 0,
          duration: 1,
          gait: "walk",
          to: { kind: "point", point: { x: 1, y: 0, z: 0 } },
        },
        {
          verb: "frame",
          actor: "cam-main",
          start: 0,
          duration: "auto",
          framing: "wide",
          move: "follow",
          on: { kind: "group", nodes: ["knightA", "knightB"] },
        },
      ],
      revise: { review: "The frame follows the two performers.", final: null },
    }),
    synthesize: (): IAutoMovieMotion => walking,
    skeleton: (): null => null,
  });
  if (result.success !== true)
    throw new Error(`performance must succeed: ${JSON.stringify(result)}`);
  const values: number[] = result.shot.cameraMotion!.tracks[0]!.values;
  TestValidator.predicate(
    "the camera translates by the change in the two performers' centre",
    nclose(values[values.length - 3]! - values[0]!, 0.5),
  );
  verifyBakedBox(script, staged);
}

/**
 * Compare the authored beginning and end of a box that turns and grows about a
 * fixed node origin.
 */
function verifyBakedBox(
  script: IAutoMovieScript,
  staged: IAutoMovieStagedSet.ISuccess,
): void {
  const display: IAutoMovieModel = {
    id: "stickman",
    name: null,
    origin: "generated",
    parts: [
      {
        id: "offset-box",
        name: null,
        geometry: {
          type: "primitive",
          shape: { type: "box", width: 2, height: 2, depth: 2 },
        },
        material: null,
        attachedBone: null,
        transform: {
          translation: { x: 3, y: 1, z: 0 },
          rotation: { x: 0, y: 0, z: 0, w: 1 },
          scale: { x: 1, y: 1, z: 1 },
        },
      },
    ],
    skeleton: null,
    body: null,
    materials: [],
    asset: null,
  };
  const authored: IAutoMovieClip = {
    id: "display-turn",
    name: null,
    duration: 1,
    loop: false,
    tracks: [
      {
        channel: { kind: "node", node: "knightA", path: "translation" },
        times: [0, 1],
        values: [0, 0, 0, 0, 0, 0],
        interpolation: "linear",
      },
      {
        channel: { kind: "node", node: "knightA", path: "rotation" },
        times: [0, 1],
        values: [0, 0, 0, 1, 0, Math.SQRT1_2, 0, Math.SQRT1_2],
        interpolation: "linear",
      },
      {
        channel: { kind: "node", node: "knightA", path: "scale" },
        times: [0, 1],
        values: [1, 1, 1, 2, 2, 2],
        interpolation: "linear",
      },
    ],
  };
  const result: IAutoMoviePerformedShot = performShot({
    frameFormat: SQUARE_FRAME_AT_24_FPS,
    script,
    staged,
    performance: makePerformanceWrite({
      duration: 1,
      draft: [
        {
          verb: "frame",
          actor: "cam-main",
          start: 0,
          duration: "auto",
          framing: "wide",
          move: "follow",
          on: { kind: "group", nodes: ["knightA"] },
        },
      ],
      revise: {
        review: "The frame follows the displayed geometry.",
        final: null,
      },
    }),
    models: [display],
    objectMotions: [authored],
    synthesize: (): null => null,
    skeleton: (): null => null,
  });
  if (result.success !== true)
    throw new Error(`performance must succeed: ${JSON.stringify(result)}`);
  const keys: number[] = result.shot.cameraMotion!.tracks[0]!.values;
  TestValidator.predicate(
    "the camera follows baked rotation and scale around a stationary pivot",
    nclose(keys[keys.length - 3]! - keys[0]!, -3) &&
      nclose(keys[keys.length - 1]! - keys[2]!, -6),
  );
}
