import {
  applyAutoMovieInteriorAcousticResponse,
  deriveAutoMovieInteriorAcousticResponse,
} from "@automovie/engine";
import type { IAutoMovieProductionAcousticResponse } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createInteriorAcousticTestInputs } from "../internal/audio/createInteriorAcousticTestInputs";
import { throwsError } from "../internal/predicates";

/**
 * PCM clock, shape and path-specific facts refuse their invalid boundaries while the response basis remains supported.
 *
 * Scenarios:
 * 1. Fractional or zero clocks, incomplete/empty frames and non-finite PCM are refused.
 * 2. Transmission outside[0,1], absent or nonpositive T60 and absent or nonpositive direct/diffuse ratio are refused against supported room bases.
 *
 * @evidence contracts/testing.md#behavioral-verification Derives actual available same/different-room bases, then invokes the real PCM applicator with independently invalid clock, frame-shape, nonfinite-sample and path-specific response facts, observing named refusals.
 * @evidence contracts/testing.md#independent-expectations Literal malformed values and positive base status assertions determine refusal expectations independently; existing narrow fixture views are used only after those real derivations. This admission unit does not independently measure room acoustics or prove every finite amplitude yields finite accumulated output.
 * @evidence contracts/testing.md#distinguishing-cases Preserves fractional/zero channels/rates, incomplete/empty PCM, NaN/both infinities, null/negative/excess transmission and null/zero T60 or direct/diffuse ratio. Separate path/material tests own accepted PCM values and bounded tail behavior.
 * @evidence contracts/testing.md#execution-ownership This named synchronous unit owns fresh requests, buffers and refusal callbacks through the existing canonical fixture; it opens no file, codec/audio device, native solver, renderer, browser or GPU and replaces no foreign method.
 */
export function test_engine_interior_acoustic_pcm_admission(): void {
  const {
    digest,
    profile,
    request,
  }: ReturnType<typeof createInteriorAcousticTestInputs> =
    createInteriorAcousticTestInputs();

  const same: ReturnType<typeof deriveAutoMovieInteriorAcousticResponse> =
    deriveAutoMovieInteriorAcousticResponse({
      sourceSpace: "room-a",
      listenerSpace: "room-a",
      inputRevision: digest,
      request: request(),
      profile,
    });

  const across: ReturnType<typeof deriveAutoMovieInteriorAcousticResponse> =
    deriveAutoMovieInteriorAcousticResponse({
      sourceSpace: "room-a",
      listenerSpace: "room-b",
      inputRevision: digest,
      request: request(),
      profile,
    });

  const dry: Float32Array = Float32Array.from([1, 0]);

  TestValidator.equals(
    "both arranged room-response bases are available before invalidating facts",
    [same.status, across.status],
    ["available", "available"],
  );

  const availableSame: Extract<
    IAutoMovieProductionAcousticResponse,
    { status: "available" }
  > = same as Extract<
    IAutoMovieProductionAcousticResponse,
    { status: "available" }
  >;

  const availableAcross: Extract<
    IAutoMovieProductionAcousticResponse,
    { status: "available" }
  > = across as Extract<
    IAutoMovieProductionAcousticResponse,
    { status: "available" }
  >;

  TestValidator.equals(
    "PCM application refuses invalid clocks, shapes, and path-specific facts",
    {
      fractionalChannels: throwsError(
        (): Float32Array =>
          applyAutoMovieInteriorAcousticResponse({
            samples: dry,
            channels: 1.5,
            sampleRate: 100,
            response: availableSame,
          }),
        "positive integer",
      ),
      zeroChannels: throwsError(
        (): Float32Array =>
          applyAutoMovieInteriorAcousticResponse({
            samples: dry,
            channels: 0,
            sampleRate: 100,
            response: availableSame,
          }),
        "positive integer",
      ),
      fractionalRate: throwsError(
        (): Float32Array =>
          applyAutoMovieInteriorAcousticResponse({
            samples: dry,
            channels: 1,
            sampleRate: 100.5,
            response: availableSame,
          }),
        "sample rate",
      ),
      zeroRate: throwsError(
        (): Float32Array =>
          applyAutoMovieInteriorAcousticResponse({
            samples: dry,
            channels: 1,
            sampleRate: 0,
            response: availableSame,
          }),
        "sample rate",
      ),
      incompleteFrame: throwsError(
        (): Float32Array =>
          applyAutoMovieInteriorAcousticResponse({
            samples: Float32Array.from([1]),
            channels: 2,
            sampleRate: 100,
            response: availableSame,
          }),
        "complete frames",
      ),
      emptyPcm: throwsError(
        (): Float32Array =>
          applyAutoMovieInteriorAcousticResponse({
            samples: new Float32Array(),
            channels: 1,
            sampleRate: 100,
            response: availableSame,
          }),
        "must not be empty",
      ),
      nanSample: throwsError(
        (): Float32Array =>
          applyAutoMovieInteriorAcousticResponse({
            samples: Float32Array.from([Number.NaN]),
            channels: 1,
            sampleRate: 100,
            response: availableSame,
          }),
        "samples must be finite",
      ),
      positiveInfinitySample: throwsError(
        (): Float32Array =>
          applyAutoMovieInteriorAcousticResponse({
            samples: Float32Array.from([Number.POSITIVE_INFINITY]),
            channels: 1,
            sampleRate: 100,
            response: availableSame,
          }),
        "samples must be finite",
      ),
      negativeInfinitySample: throwsError(
        (): Float32Array =>
          applyAutoMovieInteriorAcousticResponse({
            samples: Float32Array.from([Number.NEGATIVE_INFINITY]),
            channels: 1,
            sampleRate: 100,
            response: availableSame,
          }),
        "samples must be finite",
      ),
      nullTransmission: throwsError(
        (): Float32Array =>
          applyAutoMovieInteriorAcousticResponse({
            samples: dry,
            channels: 1,
            sampleRate: 100,
            response: { ...availableAcross, transmissionGain: null },
          }),
        "transmission gain",
      ),
      negativeTransmission: throwsError(
        (): Float32Array =>
          applyAutoMovieInteriorAcousticResponse({
            samples: dry,
            channels: 1,
            sampleRate: 100,
            response: { ...availableAcross, transmissionGain: -1 },
          }),
        "transmission gain",
      ),
      excessTransmission: throwsError(
        (): Float32Array =>
          applyAutoMovieInteriorAcousticResponse({
            samples: dry,
            channels: 1,
            sampleRate: 100,
            response: { ...availableAcross, transmissionGain: 2 },
          }),
        "transmission gain",
      ),
      nullReverberation: throwsError(
        (): Float32Array =>
          applyAutoMovieInteriorAcousticResponse({
            samples: dry,
            channels: 1,
            sampleRate: 100,
            response: {
              ...availableSame,
              reverberationTimeSeconds: null,
            },
          }),
        "reverberation time",
      ),
      zeroReverberation: throwsError(
        (): Float32Array =>
          applyAutoMovieInteriorAcousticResponse({
            samples: dry,
            channels: 1,
            sampleRate: 100,
            response: { ...availableSame, reverberationTimeSeconds: 0 },
          }),
        "reverberation time",
      ),
      nullRatio: throwsError(
        (): Float32Array =>
          applyAutoMovieInteriorAcousticResponse({
            samples: dry,
            channels: 1,
            sampleRate: 100,
            response: { ...availableSame, directToDiffuseRatio: null },
          }),
        "direct-to-diffuse ratio",
      ),
      zeroRatio: throwsError(
        (): Float32Array =>
          applyAutoMovieInteriorAcousticResponse({
            samples: dry,
            channels: 1,
            sampleRate: 100,
            response: { ...availableSame, directToDiffuseRatio: 0 },
          }),
        "direct-to-diffuse ratio",
      ),
    },
    {
      fractionalChannels: true,
      zeroChannels: true,
      fractionalRate: true,
      zeroRate: true,
      incompleteFrame: true,
      emptyPcm: true,
      nanSample: true,
      positiveInfinitySample: true,
      negativeInfinitySample: true,
      nullTransmission: true,
      negativeTransmission: true,
      excessTransmission: true,
      nullReverberation: true,
      zeroReverberation: true,
      nullRatio: true,
      zeroRatio: true,
    },
  );
}
