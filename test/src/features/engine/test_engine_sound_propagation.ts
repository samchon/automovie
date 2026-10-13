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
 * Direct-path receipts and the actual native mix preserve emission, cross-cut arrival, exact legacy bytes and trim silence.
 *
 * Scenarios:
 * 1. Distance20 m at 100 m/s delays emission frame 2 to arrival frame 4 at 10 fps, with distance gain 0.2 and spectral gain 0.1.
 * 2. Zero distance preserves exact legacy PCM bytes; trim stays silent and carry starts at sample 19200 with alignment at 0.4 s.
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
            // Arrival0.4s plus contact duration0.22s ends at sample29760.
            // The final included sample precedes that exclusive boundary.
            completeContactTail:
              rendered.pcm[(29_760 - 1) * 2] !== 0 &&
              rendered.pcm[29_760 * 2] === 0 &&
              rendered.pcm[29_760 * 2 + 1] === 0,
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
          completeContactTail: true,
          sampleFrames: 33_600,
          expectedSeconds: 0.4,
          aligned: true,
        },
      },
    );
};
