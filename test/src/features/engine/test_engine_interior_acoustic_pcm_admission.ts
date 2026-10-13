import {
  applyAutoMovieInteriorAcousticResponse,
  deriveAutoMovieInteriorAcousticResponse,
} from "@automovie/engine";
import type {
  IAutoMovieProductionAcousticResponse,
} from "@automovie/interface";
import {
  TestValidator,
} from "@nestia/e2e";
import {
  throwsError,
} from "../internal/predicates";

import { createInteriorAcousticTestInputs } from "../internal/audio/createInteriorAcousticTestInputs";

/**
 * PCM clock, shape and path-specific facts refuse their invalid boundaries while the response basis remains supported.
 *
 * Scenarios:
 * 1. Fractional or zero clocks, incomplete/empty frames and non-finite PCM are refused.
 * 2. Transmission outside[0,1], absent or nonpositive T60 and absent or nonpositive direct/diffuse ratio are refused against supported room bases.
 */
export const test_engine_interior_acoustic_pcm_admission = (): void => {
  const { digest, profile, request } = createInteriorAcousticTestInputs();

  const same = deriveAutoMovieInteriorAcousticResponse({
      sourceSpace: "room-a",
      listenerSpace: "room-a",
      inputRevision: digest,
      request: request(),
      profile,
    });

  const across = deriveAutoMovieInteriorAcousticResponse({
      sourceSpace: "room-a",
      listenerSpace: "room-b",
      inputRevision: digest,
      request: request(),
      profile,
    });

  const dry = Float32Array.from([1, 0]);

  TestValidator.equals(
    "both arranged room-response bases are available before invalidating facts",
    [same.status, across.status],
    ["available", "available"],
  );

  const availableSame = same as Extract<
      IAutoMovieProductionAcousticResponse,
      { status: "available" }
    >;

  const availableAcross = across as Extract<
      IAutoMovieProductionAcousticResponse,
      { status: "available" }
    >;

  TestValidator.equals(
      "PCM application refuses invalid clocks, shapes, and path-specific facts",
      {
        fractionalChannels: throwsError(
          () =>
            applyAutoMovieInteriorAcousticResponse({
              samples: dry,
              channels: 1.5,
              sampleRate: 100,
              response: availableSame,
            }),
          "positive integer",
        ),
        zeroChannels: throwsError(
          () =>
            applyAutoMovieInteriorAcousticResponse({
              samples: dry,
              channels: 0,
              sampleRate: 100,
              response: availableSame,
            }),
          "positive integer",
        ),
        fractionalRate: throwsError(
          () =>
            applyAutoMovieInteriorAcousticResponse({
              samples: dry,
              channels: 1,
              sampleRate: 100.5,
              response: availableSame,
            }),
          "sample rate",
        ),
        zeroRate: throwsError(
          () =>
            applyAutoMovieInteriorAcousticResponse({
              samples: dry,
              channels: 1,
              sampleRate: 0,
              response: availableSame,
            }),
          "sample rate",
        ),
        incompleteFrame: throwsError(
          () =>
            applyAutoMovieInteriorAcousticResponse({
              samples: Float32Array.from([1]),
              channels: 2,
              sampleRate: 100,
              response: availableSame,
            }),
          "complete frames",
        ),
        emptyPcm: throwsError(
          () =>
            applyAutoMovieInteriorAcousticResponse({
              samples: new Float32Array(),
              channels: 1,
              sampleRate: 100,
              response: availableSame,
            }),
          "must not be empty",
        ),
        nanSample: throwsError(
          () =>
            applyAutoMovieInteriorAcousticResponse({
              samples: Float32Array.from([Number.NaN]),
              channels: 1,
              sampleRate: 100,
              response: availableSame,
            }),
          "samples must be finite",
        ),
        positiveInfinitySample: throwsError(
          () =>
            applyAutoMovieInteriorAcousticResponse({
              samples: Float32Array.from([Number.POSITIVE_INFINITY]),
              channels: 1,
              sampleRate: 100,
              response: availableSame,
            }),
          "samples must be finite",
        ),
        negativeInfinitySample: throwsError(
          () =>
            applyAutoMovieInteriorAcousticResponse({
              samples: Float32Array.from([Number.NEGATIVE_INFINITY]),
              channels: 1,
              sampleRate: 100,
              response: availableSame,
            }),
          "samples must be finite",
        ),
        nullTransmission: throwsError(
          () =>
            applyAutoMovieInteriorAcousticResponse({
              samples: dry,
              channels: 1,
              sampleRate: 100,
              response: { ...availableAcross, transmissionGain: null },
            }),
          "transmission gain",
        ),
        negativeTransmission: throwsError(
          () =>
            applyAutoMovieInteriorAcousticResponse({
              samples: dry,
              channels: 1,
              sampleRate: 100,
              response: { ...availableAcross, transmissionGain: -1 },
            }),
          "transmission gain",
        ),
        excessTransmission: throwsError(
          () =>
            applyAutoMovieInteriorAcousticResponse({
              samples: dry,
              channels: 1,
              sampleRate: 100,
              response: { ...availableAcross, transmissionGain: 2 },
            }),
          "transmission gain",
        ),
        nullReverberation: throwsError(
          () =>
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
          () =>
            applyAutoMovieInteriorAcousticResponse({
              samples: dry,
              channels: 1,
              sampleRate: 100,
              response: { ...availableSame, reverberationTimeSeconds: 0 },
            }),
          "reverberation time",
        ),
        nullRatio: throwsError(
          () =>
            applyAutoMovieInteriorAcousticResponse({
              samples: dry,
              channels: 1,
              sampleRate: 100,
              response: { ...availableSame, directToDiffuseRatio: null },
            }),
          "direct-to-diffuse ratio",
        ),
        zeroRatio: throwsError(
          () =>
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
};
