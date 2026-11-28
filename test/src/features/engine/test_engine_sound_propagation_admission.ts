import { AutoMovieEngineSound } from "@automovie/engine";
import type { IAutoMovieSoundPropagationProfile } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createSoundPropagationTestInputs } from "../internal/audio/createSoundPropagationTestInputs";
import { throwsError } from "../internal/predicates";

/**
 * Propagation clock, distance, physical profile and out-of-film arrival
 * boundaries refuse unsupported inputs.
 *
 * Scenarios:
 *
 * 1. Empty assumptions and invalid physical profile values retain exact refusals.
 * 2. Distance, emission, segment, frame rate, total span and out-of-film arrival
 *    refuse their negative boundaries.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Invokes actual propagation derivation for individually malformed clocks, distance and physical profile fields, observing each original diagnostic substring instead of accepting a fallback receipt.
 * @evidence contracts/development/testing.md#independent-expectations Literal invalid values and exclusive film/segment bounds determine the expected refusals independently. The fixed valid base arranges one changed premise at a time; diagnostic agreement does not prove numeric conditioning or every possible malformed input.
 * @evidence contracts/development/common.md#meaningful-documentation Empty and malformed physical assumptions exercise profile refusals. Distance, emission, segment, clock and out-of-film arrival each have located controls.
 */
export function test_engine_sound_propagation_admission(): void {
  const { profile }: ReturnType<typeof createSoundPropagationTestInputs> =
    createSoundPropagationTestInputs();

  TestValidator.equals(
    "invalid or out-of-film propagation is refused without fallback",
    {
      assumptions: throwsError(
        (): ReturnType<typeof AutoMovieEngineSound.deriveSoundPropagation> =>
          AutoMovieEngineSound.deriveSoundPropagation({
            distanceMeters: 1,
            emissionFrame: 0,
            segmentEndFrame: 1,
            fps: 24,
            totalFrames: 2,
            profile: { ...profile(), assumptions: [] },
          }),
        "assumptions",
      ),
      outside: throwsError(
        (): ReturnType<typeof AutoMovieEngineSound.deriveSoundPropagation> =>
          AutoMovieEngineSound.deriveSoundPropagation({
            distanceMeters: 100,
            emissionFrame: 1,
            segmentEndFrame: 2,
            fps: 10,
            totalFrames: 3,
            profile: profile(),
          }),
        "outside",
      ),
      coefficient: throwsError(
        (): ReturnType<typeof AutoMovieEngineSound.deriveSoundPropagation> =>
          AutoMovieEngineSound.deriveSoundPropagation({
            distanceMeters: 1,
            emissionFrame: 0,
            segmentEndFrame: 2,
            fps: 10,
            totalFrames: 3,
            profile: {
              ...profile(),
              distanceGain: {
                kind: "softened-inverse-square-v1",
                coefficient: -1,
              },
            },
          }),
        "coefficient",
      ),
    },
    { assumptions: true, outside: true, coefficient: true },
  );

  const propagate: (
    values?: Partial<
      Pick<
        Parameters<typeof AutoMovieEngineSound.deriveSoundPropagation>[0],
        | "distanceMeters"
        | "emissionFrame"
        | "segmentEndFrame"
        | "fps"
        | "totalFrames"
      >
    >,
    selected?: IAutoMovieSoundPropagationProfile,
  ) => ReturnType<typeof AutoMovieEngineSound.deriveSoundPropagation> = (
    values: Partial<{
      distanceMeters: number;
      emissionFrame: number;
      segmentEndFrame: number;
      fps: number;
      totalFrames: number;
    }> = {},
    selected: IAutoMovieSoundPropagationProfile = profile(),
  ): ReturnType<typeof AutoMovieEngineSound.deriveSoundPropagation> =>
    AutoMovieEngineSound.deriveSoundPropagation({
      distanceMeters: 1,
      emissionFrame: 0,
      segmentEndFrame: 2,
      fps: 10,
      totalFrames: 3,
      profile: selected,
      ...values,
    });

  TestValidator.equals(
    "every numeric and profile precondition refuses its negative boundary",
    {
      distanceNegative: throwsError(
        (): ReturnType<typeof propagate> => propagate({ distanceMeters: -1 }),
        "non-negative",
      ),
      emissionNegative: throwsError(
        (): ReturnType<typeof propagate> => propagate({ emissionFrame: -1 }),
        "integer at least 0",
      ),
      segmentBeforeEmission: throwsError(
        (): ReturnType<typeof propagate> => propagate({ segmentEndFrame: 0 }),
        "integer at least 1",
      ),
      fpsZero: throwsError(
        (): ReturnType<typeof propagate> => propagate({ fps: 0 }),
        "positive",
      ),
      totalZero: throwsError(
        (): ReturnType<typeof propagate> => propagate({ totalFrames: 0 }),
        "integer at least 1",
      ),
      emissionOutside: throwsError(
        (): ReturnType<typeof propagate> =>
          propagate({ emissionFrame: 3, segmentEndFrame: 4 }),
        "emission frame lies outside",
      ),
      segmentOutside: throwsError(
        (): ReturnType<typeof propagate> => propagate({ segmentEndFrame: 4 }),
        "segment end lies outside",
      ),
      speedZero: throwsError(
        (): ReturnType<typeof propagate> =>
          propagate({}, { ...profile(), speedOfSoundMetersPerSecond: 0 }),
        "speed must be finite and positive",
      ),
      blankAssumption: throwsError(
        (): ReturnType<typeof propagate> =>
          propagate({}, { ...profile(), assumptions: [" "] }),
        "assumptions",
      ),
      absorptionNegative: throwsError(
        (): ReturnType<typeof propagate> =>
          propagate(
            {},
            {
              ...profile(),
              spectral: {
                kind: "broadband-high-frequency-v1",
                absorptionDbPerMeter: -1,
              },
            },
          ),
        "absorption must be finite",
      ),
    },
    {
      distanceNegative: true,
      emissionNegative: true,
      segmentBeforeEmission: true,
      fpsZero: true,
      totalZero: true,
      emissionOutside: true,
      segmentOutside: true,
      speedZero: true,
      blankAssumption: true,
      absorptionNegative: true,
    },
  );
}
