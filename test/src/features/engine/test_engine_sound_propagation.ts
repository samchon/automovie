import {
  deriveAutoMovieSoundPropagation,
  renderProductionSound,
} from "@automovie/engine";
import {
  TestValidator,
} from "@nestia/e2e";
import {
  nclose,
} from "../internal/predicates";

import { createSoundPropagationTestInputs } from "../internal/audio/createSoundPropagationTestInputs";

/**
 *
 * Direct-path receipts and the actual native mix preserve emission, cross-cut arrival, exact legacy bytes and trim silence.
 *
 * Scenarios:
 * 1. Distance20 m at 100 m/s delays emission frame 2 to arrival frame 4 at 10 fps, with distance gain 0.2 and spectral gain 0.1.
 * 2. Zero distance preserves exact legacy PCM bytes; trim stays silent and carry starts at sample 19200 with alignment at 0.4 s.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls `deriveAutoMovieSoundPropagation` for a 20 m carried path, a zero-distance path and a trimmed path, asserting arrival frame, boundary, distance gain and high-frequency gain, then renders event plans carrying those receipts with `renderProductionSound` and asserts byte identity with the receipt-free plan, the first audible sample, the buffer length and event alignment; it catches arrival computed from the emission frame alone, a cut boundary that truncates a carried sound or lets a trimmed one through, a distance or absorption law applied with the wrong exponent, and a zero-distance receipt that perturbs the legacy mix.
 * @evidence contracts/testing.md#independent-expectations Arrival is 0.2 s plus 20 m at the declared 100 m/s, 0.4 s or frame 4 at 10 fps and sample 19,200 at 48 kHz; gain 0.2 is the softened inverse square `1 / (1 + 0.01 * 20^2)`; 0.1 is 1 dB/m over 20 m; 33,600 samples are seven 10 fps frames at 48 kHz; byte identity compares against the same plan without a receipt rather than a stored buffer, so it cannot catch a defect shared by both mixes.
 * @evidence contracts/testing.md#distinguishing-cases Positive carried-across-cut path; boundary of zero distance with spectral filtering switched off, which must be the identity; negative trim-at-segment path that must stay silent and fail alignment beside the carried twin; malformed propagation inputs belong to `test_engine_sound_propagation_admission`, and the spectral filter's effect on the waveform to `test_engine_sound_propagation_spectral_mix`.
 */
export const test_engine_sound_propagation = (): void => {
  const { profile, eventPlan, firstAudibleFrame } = createSoundPropagationTestInputs();

  const carried = deriveAutoMovieSoundPropagation({
      distanceMeters: 20,
      emissionFrame: 2,
      segmentEndFrame: 3,
      fps: 10,
      totalFrames: 7,
      profile: profile(),
    });

  TestValidator.equals(
      "declared propagation keeps emission separate from cross-cut arrival",
      {
        arrival: carried.arrivalFrame,
        boundary: carried.boundary,
        gain: nclose(carried.distanceGain, 0.2),
        high: nclose(carried.highFrequencyGain!, 0.1),
      },
      { arrival: 4, boundary: "carried-across-cut", gain: true, high: true },
    );

  const zero = deriveAutoMovieSoundPropagation({
      distanceMeters: 0,
      emissionFrame: 2,
      segmentEndFrame: 7,
      fps: 10,
      totalFrames: 7,
      profile: { ...profile(), spectral: { kind: "none" } },
    });

  TestValidator.equals(
      "zero distance is exact and an explicit no-spectral choice stays null",
      {
        arrival: zero.arrivalFrame,
        gain: zero.distanceGain,
        high: zero.highFrequencyGain,
        boundary: zero.boundary,
        legacyBytes: Buffer.from(
          renderProductionSound({ plan: eventPlan(zero) }).pcm.buffer,
        ).equals(
          Buffer.from(renderProductionSound({ plan: eventPlan() }).pcm.buffer),
        ),
      },
      {
        arrival: 2,
        gain: 1,
        high: null,
        boundary: "inside-segment",
        legacyBytes: true,
      },
    );

  const trimmed = deriveAutoMovieSoundPropagation({
      distanceMeters: 20,
      emissionFrame: 2,
      segmentEndFrame: 3,
      fps: 10,
      totalFrames: 7,
      profile: { ...profile(), segmentBoundary: "trim-at-segment" },
    });

  TestValidator.equals(
      "the authored trim decision yields silence while carry starts at arrival",
      {
        trim: (() => {
          const rendered = renderProductionSound({ plan: eventPlan(trimmed) });
          return {
            audibleFrame: firstAudibleFrame(rendered.pcm),
            aligned: rendered.analysis.eventAlignment[0]!.passed,
          };
        })(),
        carry: (() => {
          const rendered = renderProductionSound({ plan: eventPlan(carried) });
          return {
            startsAtArrival:
              firstAudibleFrame(rendered.pcm) === 19_200,
            sampleFrames: rendered.analysis.sampleFrames,
            expectedSeconds: rendered.analysis.eventAlignment[0]!.expectedSeconds,
            aligned: rendered.analysis.eventAlignment[0]!.passed,
          };
        })(),
      },
      {
        trim: { audibleFrame: -1, aligned: false },
        carry: {
          startsAtArrival: true,
          sampleFrames: 33_600,
          expectedSeconds: 0.4,
          aligned: true,
        },
      },
    );
};
