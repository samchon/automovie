import type { IAutoMovieInspectionDiagnostics } from "@automovie/interface";
import { type IAutoMovieRenderDrawScene, AutoMovieRenderDraw } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import { Object3D, PerspectiveCamera, Scene } from "three";

import { nclose, throwsError } from "../../internal/predicates";

/** The clocks and translation-only matrix positions are exact binary values. */
const EXACT_TOLERANCE: number = 0;

/** Ratios of projection coefficients cover the division and native rounding. */
const ASPECT_TOLERANCE: number = 16 * Number.EPSILON;

/**
 * Inspection receives the delivery camera and the exact output index for an
 * admitted placed sample, and refuses packets on other clocks.
 *
 * Scenarios:
 *
 * 1. At four fps, second 0.5 is output frame 2. The observer supplies that index
 *    even if its producer supplies only a source-shot clock.
 * 2. An off-grid sample and the end boundary have no output index. Synchronous
 *    film placement refreshes world matrices and is omitted for a shot seek.
 * 3. Another film second, another frame, or a frame on an off-grid sample is
 *    refused. A subject without a producer has no observation.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Uses the placed sample's camera and exact output index, refreshes native matrices and refuses inconsistent clocks.
 * @evidence contracts/development/testing.md#behavioral-verification Calls placed observation at a delivered sample, off-grid and end samples, a shot seek, mismatched packets and absent observation support.
 * @evidence contracts/development/testing.md#independent-expectations At four fps a half-second is output frame 2. Off-grid and end samples lack an index, and independent camera and matrix fixtures identify the projection and placement owner.
 */
export function test_render_draw_observe_placed_inspection(): void {
  const scene: Scene = new Scene();
  const subjectRoot: Object3D = new Object3D();
  scene.add(subjectRoot);
  const camera: PerspectiveCamera = new PerspectiveCamera(90, 1, 1, 20);
  const placements: number[] = [];
  const samples: IAutoMovieRenderDrawScene.IPlacedSample[] = [];
  const sourceClock: IAutoMovieInspectionDiagnostics.IShotTime = {
    path: "shot:hold",
    seconds: 0.125,
  };
  const base: IAutoMovieRenderDrawScene = {
    scene,
    camera,
    durationSeconds: 1,
    fps: 4,
    width: 320,
    height: 160,
    seek: async (): Promise<void> => {},
    place: (seconds: number): void => {
      placements.push(seconds);
      camera.position.x = 4 * seconds;
      subjectRoot.position.x = 8 * seconds;
    },
    dispose: (): void => {},
  };
  const subject: IAutoMovieRenderDrawScene = {
    ...base,
    inspectPlaced: (
      sample: IAutoMovieRenderDrawScene.IPlacedSample,
    ): IAutoMovieInspectionDiagnostics => {
      samples.push(sample);
      if (sample.mode === "viewer" && sample.place !== undefined) {
        sample.place(0.25);
        TestValidator.predicate(
          "scratch sample publishes fresh native matrices",
          () =>
            nclose(camera.matrixWorld.elements[12]!, 1, EXACT_TOLERANCE) &&
            nclose(subjectRoot.matrixWorld.elements[12]!, 2, EXACT_TOLERANCE),
        );
        sample.place(sample.time.filmSeconds);
      }
      return {
        scope: "set/hold",
        time: { filmSeconds: sample.time.filmSeconds, shot: sourceClock },
        findings: [],
        coverage: [],
      };
    },
  };
  const exact: IAutoMovieInspectionDiagnostics =
    AutoMovieRenderDraw.observeAutoMoviePlacedInspection(subject, 0.5, "viewer")!;
  const sample: IAutoMovieRenderDrawScene.IPlacedSample = samples[0]!;
  TestValidator.predicate(
    "actual raster owns the inspection projection",
    () =>
      sample.camera === camera &&
      sample.scene === scene &&
      sample.width === 320 &&
      sample.height === 160 &&
      nclose(
        camera.projectionMatrix.elements[5]! /
          camera.projectionMatrix.elements[0]!,
        2,
        ASPECT_TOLERANCE,
      ),
  );
  TestValidator.predicate(
    "frame index enriches the existing source clock",
    () =>
      sample.time.outputFrame === 2 &&
      exact.time.outputFrame === 2 &&
      exact.time.shot?.path === sourceClock.path &&
      nclose(exact.time.shot.seconds, 0.125, EXACT_TOLERANCE) &&
      nclose(exact.time.filmSeconds, 0.5, EXACT_TOLERANCE) &&
      placements.length === 2 &&
      nclose(placements[0]!, 0.25, EXACT_TOLERANCE) &&
      nclose(placements[1]!, 0.5, EXACT_TOLERANCE),
  );

  const offGrid: IAutoMovieInspectionDiagnostics =
    AutoMovieRenderDraw.observeAutoMoviePlacedInspection(
      subject,
      0.375,
      "capture",
      undefined,
      true,
    )!;
  const end: IAutoMovieInspectionDiagnostics = AutoMovieRenderDraw.observeAutoMoviePlacedInspection(
    subject,
    1,
    "delivery",
  )!;
  TestValidator.predicate(
    "non-delivered instants have no frame and shot seeks do not offer place",
    () =>
      offGrid.time.outputFrame === undefined &&
      end.time.outputFrame === undefined &&
      samples[1]!.place === undefined &&
      samples[2]!.place !== undefined,
  );

  const invalid: {
    seconds: number;
    time: IAutoMovieInspectionDiagnostics.ITime;
  }[] = [
    { seconds: 0.5, time: { filmSeconds: 0.25 } },
    { seconds: 0.5, time: { filmSeconds: 0.5, outputFrame: 1 } },
    { seconds: 0.375, time: { filmSeconds: 0.375, outputFrame: 2 } },
  ];
  for (const { seconds, time } of invalid)
    TestValidator.predicate(
      `a mismatched clock at ${seconds} refuses`,
      throwsError(
        () =>
          AutoMovieRenderDraw.observeAutoMoviePlacedInspection(
            {
              ...base,
              inspectPlaced: (): IAutoMovieInspectionDiagnostics => ({
                scope: "set/hold",
                time,
                findings: [],
                coverage: [],
              }),
            },
            seconds,
            "viewer",
          ),
        "Inspection diagnostics do not match the placed sample",
      ),
    );
  TestValidator.equals(
    "absent producer",
    AutoMovieRenderDraw.observeAutoMoviePlacedInspection(base, 0.5, "viewer"),
    undefined,
  );
}
