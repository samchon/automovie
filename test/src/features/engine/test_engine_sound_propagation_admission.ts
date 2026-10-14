import {
  deriveAutoMovieSoundPropagation,
} from "@automovie/engine";
import type {
  IAutoMovieSoundPropagationProfile,
} from "@automovie/interface";
import {
  TestValidator,
} from "@nestia/e2e";
import {
  throwsError,
} from "../internal/predicates";

import { createSoundPropagationTestInputs } from "../internal/audio/createSoundPropagationTestInputs";

/**
 * Propagation clock, distance, physical profile and out-of-film arrival boundaries refuse unsupported inputs.
 *
 * Scenarios:
 * 1. Empty assumptions, unsupported laws and invalid physical profile values retain exact refusals.
 * 2. Distance, emission, segment, frame rate, total span and out-of-film arrival refuse their negative or non-finite boundaries.
 *
 * @evidence contracts/testing.md#behavioral-verification Invokes actual propagation derivation for individually malformed clocks, distance and physical profile fields, observing each original diagnostic substring instead of accepting a fallback receipt.
 * @evidence contracts/testing.md#independent-expectations Literal invalid values, unsupported discriminants and exclusive film/segment bounds determine the expected refusals independently. The fixed valid base arranges one changed premise at a time; diagnostic agreement does not prove numeric conditioning or every possible malformed input.
 * @evidence contracts/testing.md#distinguishing-cases Preserves empty/blank assumptions, out-of-film arrival, negative/NaN coefficient and absorption, fractional/negative/outside frames, NaN/zero fps or speed, blank identity and unsupported gain/spectral/boundary choices. Separate accepted-path units own zero distance and carry/trim PCM behavior.
 * @evidence contracts/testing.md#execution-ownership This named synchronous unit owns fresh selected profiles and refusal closures through the existing fixture; deliberate invalid discriminant casts remain negative inputs, with no file, device, decoder, renderer, browser or GPU and no foreign-method replacement.
 */
export function test_engine_sound_propagation_admission(): void {
  const { profile }: ReturnType<typeof createSoundPropagationTestInputs> = createSoundPropagationTestInputs();

  TestValidator.equals(
      "invalid or out-of-film propagation is refused without fallback",
      {
        assumptions: throwsError(
          (): ReturnType<typeof deriveAutoMovieSoundPropagation> =>
            deriveAutoMovieSoundPropagation({
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
          (): ReturnType<typeof deriveAutoMovieSoundPropagation> =>
            deriveAutoMovieSoundPropagation({
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
          (): ReturnType<typeof deriveAutoMovieSoundPropagation> =>
            deriveAutoMovieSoundPropagation({
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

  const propagate: (values?: Partial<Pick<Parameters<typeof deriveAutoMovieSoundPropagation>[0], "distanceMeters" | "emissionFrame" | "segmentEndFrame" | "fps" | "totalFrames">>, selected?: IAutoMovieSoundPropagationProfile) => ReturnType<typeof deriveAutoMovieSoundPropagation> = (
      values: Partial<{
        distanceMeters: number;
        emissionFrame: number;
        segmentEndFrame: number;
        fps: number;
        totalFrames: number;
      }> = {},
      selected: IAutoMovieSoundPropagationProfile = profile(),
    ): ReturnType<typeof deriveAutoMovieSoundPropagation> =>
      deriveAutoMovieSoundPropagation({
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
        distanceNaN: throwsError(
          (): ReturnType<typeof propagate> => propagate({ distanceMeters: NaN }),
          "non-negative",
        ),
        distanceNegative: throwsError(
          (): ReturnType<typeof propagate> => propagate({ distanceMeters: -1 }),
          "non-negative",
        ),
        emissionFractional: throwsError(
          (): ReturnType<typeof propagate> => propagate({ emissionFrame: 0.5 }),
          "integer at least 0",
        ),
        emissionNegative: throwsError(
          (): ReturnType<typeof propagate> => propagate({ emissionFrame: -1 }),
          "integer at least 0",
        ),
        segmentBeforeEmission: throwsError(
          (): ReturnType<typeof propagate> => propagate({ segmentEndFrame: 0 }),
          "integer at least 1",
        ),
        fpsNaN: throwsError((): ReturnType<typeof propagate> => propagate({ fps: NaN }), "positive"),
        fpsZero: throwsError((): ReturnType<typeof propagate> => propagate({ fps: 0 }), "positive"),
        totalFractional: throwsError(
          (): ReturnType<typeof propagate> => propagate({ totalFrames: 2.5 }),
          "integer at least 1",
        ),
        totalZero: throwsError(
          (): ReturnType<typeof propagate> => propagate({ totalFrames: 0 }),
          "integer at least 1",
        ),
        emissionOutside: throwsError(
          (): ReturnType<typeof propagate> => propagate({ emissionFrame: 3, segmentEndFrame: 4 }),
          "emission frame lies outside",
        ),
        segmentOutside: throwsError(
          (): ReturnType<typeof propagate> => propagate({ segmentEndFrame: 4 }),
          "segment end lies outside",
        ),
        blankProfile: throwsError(
          (): ReturnType<typeof propagate> => propagate({}, { ...profile(), id: " " }),
          "id must not be blank",
        ),
        speedNaN: throwsError(
          (): ReturnType<typeof propagate> => propagate({}, { ...profile(), speedOfSoundMetersPerSecond: NaN }),
          "speed must be finite and positive",
        ),
        speedZero: throwsError(
          (): ReturnType<typeof propagate> => propagate({}, { ...profile(), speedOfSoundMetersPerSecond: 0 }),
          "speed must be finite and positive",
        ),
        gainLaw: throwsError(
          (): ReturnType<typeof propagate> =>
            propagate({}, {
              ...profile(),
              distanceGain: { kind: "other", coefficient: 1 },
            } as unknown as IAutoMovieSoundPropagationProfile),
          "gain law is unsupported",
        ),
        coefficientNaN: throwsError(
          (): ReturnType<typeof propagate> =>
            propagate(
              {},
              {
                ...profile(),
                distanceGain: {
                  kind: "softened-inverse-square-v1",
                  coefficient: NaN,
                },
              },
            ),
          "coefficient must be finite",
        ),
        blankAssumption: throwsError(
          (): ReturnType<typeof propagate> => propagate({}, { ...profile(), assumptions: [" "] }),
          "assumptions",
        ),
        absorptionNaN: throwsError(
          (): ReturnType<typeof propagate> =>
            propagate(
              {},
              {
                ...profile(),
                spectral: {
                  kind: "broadband-high-frequency-v1",
                  absorptionDbPerMeter: NaN,
                },
              },
            ),
          "absorption must be finite",
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
        spectralLaw: throwsError(
          (): ReturnType<typeof propagate> =>
            propagate({}, {
              ...profile(),
              spectral: { kind: "other" },
            } as unknown as IAutoMovieSoundPropagationProfile),
          "spectral law is unsupported",
        ),
        segmentBoundary: throwsError(
          (): ReturnType<typeof propagate> =>
            propagate({}, {
              ...profile(),
              segmentBoundary: "other",
            } as unknown as IAutoMovieSoundPropagationProfile),
          "segment-boundary policy is unsupported",
        ),
      },
      {
        distanceNaN: true,
        distanceNegative: true,
        emissionFractional: true,
        emissionNegative: true,
        segmentBeforeEmission: true,
        fpsNaN: true,
        fpsZero: true,
        totalFractional: true,
        totalZero: true,
        emissionOutside: true,
        segmentOutside: true,
        blankProfile: true,
        speedNaN: true,
        speedZero: true,
        gainLaw: true,
        coefficientNaN: true,
        blankAssumption: true,
        absorptionNaN: true,
        absorptionNegative: true,
        spectralLaw: true,
        segmentBoundary: true,
      },
    );
}
