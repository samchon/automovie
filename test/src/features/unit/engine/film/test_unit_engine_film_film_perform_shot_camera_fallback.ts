import { performShot, stageScene } from "@automovie/engine";
import {
  IAutoMovieCameraClearanceEnvelope,
  IAutoMovieCameraDepthPrecisionConstraint,
  IAutoMoviePerformance,
  type IAutoMoviePerformedShot,
  IAutoMovieSkeleton,
  type IAutoMovieStagedSet,
  IAutoMovieTransform,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import {
  makePerformanceWrite,
  makeScriptWrite,
  makeStagingWrite,
  validSynthesizer,
} from "../../../internal/filmFixtures";
import { createSkeleton } from "../../../internal/fixtures";
import { hasViolation, namedFacts } from "../../../internal/predicates";

/**
 * A frameless take selects the first staged camera.
 *
 * Scenarios:
 *
 * 1. Accept a frameless shot using cam-main with no camera motion.
 * 2. Ignore an unused empty second id.
 * 3. Refuse a scene with no cameras.
 */
export function test_unit_engine_film_film_perform_shot_camera_fallback(): void {
  const performance: IAutoMoviePerformance = makePerformanceWrite({
    draft: [
      {
        verb: "gesture",
        actor: "knightA",
        start: 0,
        duration: 1,
        kind: "wave",
      },
    ],
    revise: { review: "unchanged.", final: null },
  });

  const staged: IAutoMovieStagedSet = stageScene(
    makeScriptWrite(),
    makeStagingWrite(),
  );
  if (staged.success !== true) throw new Error("staging must succeed");
  const performed: IAutoMoviePerformedShot = performShot({
    script: makeScriptWrite(),
    staged,
    performance,
    synthesize: validSynthesizer,
    skeleton: (): IAutoMovieSkeleton => createSkeleton(),
  });
  TestValidator.equals("falls back", performed.success, true);
  if (performed.success === true) {
    TestValidator.equals(
      "first scene camera live",
      performed.shot.camera,
      "cam-main",
    );
    TestValidator.equals(
      "no frame action, locked-off camera",
      performed.shot.cameraMotion,
      null,
    );
  }

  // 2. An empty id the fallback does not pick leaves the take untouched.
  const withCameraIds: (...ids: string[]) => IAutoMovieStagedSet.ISuccess = (
    ...ids: string[]
  ): typeof staged => ({
    ...staged,
    scene: {
      ...staged.scene,
      cameras: ids.map(
        (
          id: string,
        ): {
          id: string;
          transform: IAutoMovieTransform;
          fovY: number;
          near: number;
          far: number;
          depthPrecision: IAutoMovieCameraDepthPrecisionConstraint;
          clearance?: IAutoMovieCameraClearanceEnvelope | undefined;
        } => ({ ...staged.scene.cameras[0]!, id }),
      ),
    },
  });
  TestValidator.equals(
    "an empty id the fallback does not pick still performs",
    performShot({
      script: makeScriptWrite(),
      staged: withCameraIds("cam-main", ""),
      performance,
      synthesize: validSynthesizer,
      skeleton: (): IAutoMovieSkeleton => createSkeleton(),
    }).success,
    true,
  );

  const bare: IAutoMovieStagedSet = stageScene(
    makeScriptWrite(),
    makeStagingWrite({ cameras: [] }),
  );
  if (bare.success !== true) throw new Error("bare staging must succeed");
  const unframed: IAutoMoviePerformedShot = performShot({
    script: makeScriptWrite(),
    staged: bare,
    performance,
    synthesize: validSynthesizer,
    skeleton: (): IAutoMovieSkeleton => createSkeleton(),
  });
  TestValidator.equals("no camera fails", unframed.success, false);
  TestValidator.equals(
    "unframeable take reported",
    namedFacts([
      ["refused", (): boolean => unframed.success === false],
      [
        "violated",
        (): boolean =>
          unframed.success === false &&
          hasViolation(unframed, "type", "$input"),
      ],
    ]),
    { refused: true, violated: true },
  );
}
