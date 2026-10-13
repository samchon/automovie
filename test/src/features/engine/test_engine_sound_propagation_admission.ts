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
 *
 * Propagation clock, distance, physical profile and out-of-film arrival boundaries refuse unsupported inputs.
 *
 * Scenarios:
 * 1. Empty assumptions, unsupported laws and invalid physical profile values retain exact refusals.
 * 2. Distance, emission, segment, frame rate, total span and out-of-film arrival refuse their negative or non-finite boundaries.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls `deriveAutoMovieSoundPropagation` with one clock, distance or profile field broken at a time and asserts each refusal's message fragment; it catches a NaN or negative distance, a fractional or negative emission frame, a segment ending before emission, a zero or NaN frame rate, a fractional or zero film length, an emission or segment past the film, an arrival that lands after the film, and a blank, unsupported or non-finite profile field being propagated with a fallback instead of refused.
 * @evidence contracts/testing.md#independent-expectations Each refusal restates a documented precondition of the propagation receipt; the out-of-film case follows by hand, since 100 m at the declared 100 m/s delays frame 1 by one second to frame 11 of a three-frame film; matching is by message fragment, and the shared default call these variations start from is not itself asserted to succeed here.
 * @evidence contracts/testing.md#distinguishing-cases Twenty-four negatives: empty and blank assumptions, a late arrival, negative and NaN coefficient, NaN and negative distance, fractional and negative emission, segment before emission, NaN and zero fps, fractional and zero total, emission and segment outside the film, blank id, NaN and zero speed, unknown gain law, NaN and negative absorption, unknown spectral law and unknown boundary policy; the accepted carried, zero-distance and trimmed receipts belong to `test_engine_sound_propagation`.
 */
export const test_engine_sound_propagation_admission = (): void => {
  const { profile } = createSoundPropagationTestInputs();

  TestValidator.equals(
      "invalid or out-of-film propagation is refused without fallback",
      {
        assumptions: throwsError(
          () =>
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
          () =>
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
          () =>
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

  const propagate = (
      values: Partial<{
        distanceMeters: number;
        emissionFrame: number;
        segmentEndFrame: number;
        fps: number;
        totalFrames: number;
      }> = {},
      selected: IAutoMovieSoundPropagationProfile = profile(),
    ) =>
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
          () => propagate({ distanceMeters: NaN }),
          "non-negative",
        ),
        distanceNegative: throwsError(
          () => propagate({ distanceMeters: -1 }),
          "non-negative",
        ),
        emissionFractional: throwsError(
          () => propagate({ emissionFrame: 0.5 }),
          "integer at least 0",
        ),
        emissionNegative: throwsError(
          () => propagate({ emissionFrame: -1 }),
          "integer at least 0",
        ),
        segmentBeforeEmission: throwsError(
          () => propagate({ segmentEndFrame: 0 }),
          "integer at least 1",
        ),
        fpsNaN: throwsError(() => propagate({ fps: NaN }), "positive"),
        fpsZero: throwsError(() => propagate({ fps: 0 }), "positive"),
        totalFractional: throwsError(
          () => propagate({ totalFrames: 2.5 }),
          "integer at least 1",
        ),
        totalZero: throwsError(
          () => propagate({ totalFrames: 0 }),
          "integer at least 1",
        ),
        emissionOutside: throwsError(
          () => propagate({ emissionFrame: 3, segmentEndFrame: 4 }),
          "emission frame lies outside",
        ),
        segmentOutside: throwsError(
          () => propagate({ segmentEndFrame: 4 }),
          "segment end lies outside",
        ),
        blankProfile: throwsError(
          () => propagate({}, { ...profile(), id: " " }),
          "id must not be blank",
        ),
        speedNaN: throwsError(
          () => propagate({}, { ...profile(), speedOfSoundMetersPerSecond: NaN }),
          "speed must be finite and positive",
        ),
        speedZero: throwsError(
          () => propagate({}, { ...profile(), speedOfSoundMetersPerSecond: 0 }),
          "speed must be finite and positive",
        ),
        gainLaw: throwsError(
          () =>
            propagate({}, {
              ...profile(),
              distanceGain: { kind: "other", coefficient: 1 },
            } as unknown as IAutoMovieSoundPropagationProfile),
          "gain law is unsupported",
        ),
        coefficientNaN: throwsError(
          () =>
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
          () => propagate({}, { ...profile(), assumptions: [" "] }),
          "assumptions",
        ),
        absorptionNaN: throwsError(
          () =>
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
          () =>
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
          () =>
            propagate({}, {
              ...profile(),
              spectral: { kind: "other" },
            } as unknown as IAutoMovieSoundPropagationProfile),
          "spectral law is unsupported",
        ),
        segmentBoundary: throwsError(
          () =>
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
};
