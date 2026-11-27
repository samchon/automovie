import { AutoMovieEngineValidation } from "@automovie/engine";
import type { IAutoMovieCameraInspection } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * Camera inspection reports the strongest available evidence for a framed
 * subject. It does not mistake sparse witness rays for a pixel fraction.
 *
 * Scenarios:
 *
 * 1. Each full side or depth exclusion overrides supplied pixel and ray data.
 * 2. Counts of 6 visible from 8 isolated pixels give the exactly representable
 *    occluded fraction 1/4. Valid pixels take precedence over witnesses.
 * 3. Negative or inconsistent counts fall back to available witnesses and an empty
 *    witness set leaves the occlusion unmeasured.
 */
export function test_engine_validation_classify_camera_inspection(): void {
  const witnesses: IAutoMovieCameraInspection.IWitnesses = {
    blocked: 0,
    clear: 1,
  };
  const pixels: IAutoMovieCameraInspection.IPixels = {
    isolated: 8,
    visible: 6,
  };
  const exclusions: IAutoMovieCameraInspection.Framing[] = [
    "outside",
    "before-near",
    "past-far",
  ];
  TestValidator.equals(
    "occlusion cannot be graded when the subject is excluded",
    exclusions.map(
      (
        framing: IAutoMovieCameraInspection.Framing,
      ): IAutoMovieCameraInspection.IResult =>
        AutoMovieEngineValidation.classifyAutoMovieCameraInspection({ framing, pixels, witnesses }),
    ),
    exclusions.map(
      (
        framing: IAutoMovieCameraInspection.Framing,
      ): IAutoMovieCameraInspection.IResult => ({
        framing,
        occlusion: { status: "not-applicable" },
      }),
    ),
  );
  TestValidator.equals(
    "valid pixels take precedence over witnesses without an admitted limit",
    AutoMovieEngineValidation.classifyAutoMovieCameraInspection({
      framing: "crosses-side",
      pixels,
      witnesses,
    }),
    {
      framing: "crosses-side",
      occlusion: { status: "measured", pixels, ratio: 0.25 },
    },
  );
  TestValidator.equals(
    "a blocked-only and a clear-only witness can each describe sparse evidence",
    [
      AutoMovieEngineValidation.classifyAutoMovieCameraInspection({
        framing: "possible",
        pixels: { isolated: 8, visible: -1 },
        witnesses,
      }),
      AutoMovieEngineValidation.classifyAutoMovieCameraInspection({
        framing: "possible",
        pixels: { isolated: 8, visible: 9 },
        witnesses: { blocked: 1, clear: 0 },
      }),
      AutoMovieEngineValidation.classifyAutoMovieCameraInspection({
        framing: "possible",
        witnesses: { blocked: 0, clear: 0 },
      }),
    ].map(
      (
        result: IAutoMovieCameraInspection.IResult,
      ): IAutoMovieCameraInspection.Occlusion => result.occlusion,
    ),
    [
      { status: "witnesses", samples: witnesses },
      { status: "witnesses", samples: { blocked: 1, clear: 0 } },
      { status: "unmeasured" },
    ],
  );
}
