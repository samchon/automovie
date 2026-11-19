import { performShot, stageScene } from "@automovie/engine";
import type {
  IAutoMovieMotion,
  IAutoMoviePerformedShot,
  IAutoMovieScript,
  IAutoMovieStagedSet,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

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
 * 1. A performer moves from world X 0 to 1 while their group partner stays at X 4. The wide follow camera moves half a metre with their shared centre.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the cast motion, their positions, the framing action and its expected displacement.
 * @evidence contracts/development/testing.md#behavioral-verification Compiles the shot from a group target and reads the emitted camera translation keys through performShot.
 * @evidence contracts/development/testing.md#independent-expectations The two authored endpoints fix the midpoints at X 2 and X 2.5. A follow move retains its relative camera placement, so its X displacement must be 0.5 m within nclose's 1e-6 tolerance.
 * @evidence contracts/development/testing.md#distinguishing-cases A staged-only union stays fixed, and an actor-only follow advances one metre. The mixed moving and stationary group requires the camera to advance 0.5 m.
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
}
