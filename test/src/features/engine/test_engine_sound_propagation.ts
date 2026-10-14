import {
  deriveAutoMovieSoundPropagation,
  renderProductionSound,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { createSoundPropagationTestInputs } from "../internal/audio/createSoundPropagationTestInputs";
import { nclose } from "../internal/predicates";
import { test12ValuesClose } from "../internal/test12ValuesClose";

/**
 * Direct-path receipts and the actual native mix preserve emission, cross-cut arrival, exact legacy bytes and trim silence.
 *
 * Scenarios:
 * 1. Distance20 m at 100 m/s delays emission frame 2 to arrival frame 4 at 10 fps, with distance gain 0.2 and spectral gain 0.1.
 * 2. Zero distance preserves exact legacy PCM bytes; trim stays silent and carry starts at sample 19200 with alignment at 0.4 s.
 *
 * @evidence contracts/testing.md#behavioral-verification Derives actual direct-path receipts and mixes carried, trimmed, zero-distance and legacy event plans, observing arrival/boundary/gains, byte-identical zero-distance PCM and native onset/alignment outcomes.
 * @evidence contracts/testing.md#independent-expectations Distance20/speed100 at fps10 independently gives a two-frame delay, coefficient .01 gives gain .2 and 20 dB loss gives .1 high-frequency gain. Arrival .4 seconds maps to sample frame19200 at 48000 Hz; the seven-frame film maps to33600. Existing gain tolerances and exact numeric record strength remain unchanged.
 * @evidence contracts/testing.md#distinguishing-cases Preserves zero distance versus delayed travel, no-spectral versus declared spectral loss and carry versus trim across the exclusive cut. Raw byte equality remains the legacy oracle; onset is the first nonzero stereo frame and alignment observes mixed-master windows rather than isolated perceptual causality.
 * @evidence contracts/testing.md#execution-ownership This named synchronous unit owns fresh profiles/plans and returned native PCM through the existing fixture, with no file/codec/audio-device operation, native solver, renderer, browser or GPU and no foreign-method replacement.
 */
export function test_engine_sound_propagation(): void {
  const {
    profile,
    eventPlan,
    firstAudibleFrame,
  }: ReturnType<typeof createSoundPropagationTestInputs> =
    createSoundPropagationTestInputs();

  const carried: ReturnType<typeof deriveAutoMovieSoundPropagation> =
    deriveAutoMovieSoundPropagation({
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

  const zero: ReturnType<typeof deriveAutoMovieSoundPropagation> =
    deriveAutoMovieSoundPropagation({
      distanceMeters: 0,
      emissionFrame: 2,
      segmentEndFrame: 7,
      fps: 10,
      totalFrames: 7,
      profile: { ...profile(), spectral: { kind: "none" } },
    });

  TestValidator.predicate(
    "zero distance is exact and an explicit no-spectral choice stays null",
    test12ValuesClose(
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
    ),
  );

  const trimmed: ReturnType<typeof deriveAutoMovieSoundPropagation> =
    deriveAutoMovieSoundPropagation({
      distanceMeters: 20,
      emissionFrame: 2,
      segmentEndFrame: 3,
      fps: 10,
      totalFrames: 7,
      profile: { ...profile(), segmentBoundary: "trim-at-segment" },
    });

  TestValidator.predicate(
    "the authored trim decision yields silence while carry starts at arrival",
    test12ValuesClose(
      {
        trim: ((): { audibleFrame: number; aligned: boolean } => {
          const rendered: ReturnType<typeof renderProductionSound> =
            renderProductionSound({ plan: eventPlan(trimmed) });
          return {
            audibleFrame: firstAudibleFrame(rendered.pcm),
            aligned: rendered.analysis.eventAlignment[0]!.passed,
          };
        })(),
        carry: ((): {
          startsAtArrival: boolean;
          sampleFrames: number;
          expectedSeconds: number;
          aligned: boolean;
        } => {
          const rendered: ReturnType<typeof renderProductionSound> =
            renderProductionSound({ plan: eventPlan(carried) });
          return {
            startsAtArrival: firstAudibleFrame(rendered.pcm) === 19_200,
            sampleFrames: rendered.analysis.sampleFrames,
            expectedSeconds:
              rendered.analysis.eventAlignment[0]!.expectedSeconds,
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
    ),
  );
}
