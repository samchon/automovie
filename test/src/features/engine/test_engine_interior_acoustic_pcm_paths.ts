import {
  applyAutoMovieInteriorAcousticResponse,
  deriveAutoMovieInteriorAcousticResponse,
} from "@automovie/engine";
import {
  TestValidator,
} from "@nestia/e2e";
import {
  nclose,
} from "../internal/predicates";

import { createInteriorAcousticTestInputs } from "../internal/audio/createInteriorAcousticTestInputs";

/**
 *
 * Supported room paths apply finite impulse PCM without changing the caller's dry buffer.
 *
 * Scenarios:
 * 1. The same-room impulse retains its dry onset and adds a finite tail; the different-room path applies gain 0.1.
 * 2. Outdoor copying preserves bytes, while all three supported paths retain the caller-owned dry input.
 *
 * @evidence contracts/testing.md#behavioral-verification Applies same-room, cross-room and outdoor responses from `deriveAutoMovieInteriorAcousticResponse` to one unit impulse with `applyAutoMovieInteriorAcousticResponse` and asserts the wet onset, a non-zero tail beyond the dry length, the transmitted first sample, byte-identical outdoor output, and the dry buffer afterwards; it catches a same-room kernel that alters the direct onset or adds no tail, a cross-room path that forgets partition gain, an outdoor path that alters samples, and any path that writes into the caller's buffer.
 * @evidence contracts/testing.md#independent-expectations The onset 1 is the dry impulse itself, 0.1 is `10^(-20/20)` for the 20 dB partition, and outdoor identity and the untouched `[1, 0]` input follow from the documented copy semantics; the tail is asserted only to exist, so its shape and level are left to `test_engine_interior_acoustic_material_tail`.
 * @evidence contracts/testing.md#distinguishing-cases Positive same-room, cross-room and outdoor paths on one shared input, plus the aliasing check across all three; malformed PCM and response fields belong to `test_engine_interior_acoustic_pcm_admission`, and consumption by the production mixer to `test_engine_interior_acoustic_mix_consumption`.
 */
export const test_engine_interior_acoustic_pcm_paths = (): void => {
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

  const outdoor = deriveAutoMovieInteriorAcousticResponse({
      sourceSpace: null,
      listenerSpace: null,
      inputRevision: digest,
      request: null,
      profile,
    });

  if (same.status !== "available" || across.status !== "available")
      throw new Error("positive acoustic responses unexpectedly unavailable");

  const dry = Float32Array.from([1, 0]);

  const wet = applyAutoMovieInteriorAcousticResponse({
      samples: dry,
      channels: 1,
      sampleRate: 100,
      response: same,
    });

  const transmitted = applyAutoMovieInteriorAcousticResponse({
      samples: dry,
      channels: 1,
      sampleRate: 100,
      response: across,
    });

  const outdoors = applyAutoMovieInteriorAcousticResponse({
      samples: dry,
      channels: 1,
      sampleRate: 100,
      response: outdoor,
    });

  TestValidator.equals(
  "the bounded tier adds a finite tail, transmits across rooms, and copies outdoors",
  {
  wetStartsDry: wet[0],
  wetHasTail: wet.length > dry.length && wet.slice(1).some((x) => x !== 0),
  transmitted: nclose(transmitted[0]!, 0.1),
  outdoorBytes: Buffer.from(outdoors.buffer).equals(
          Buffer.from(dry.buffer),
        )
  },
  {
  wetStartsDry: 1,
  wetHasTail: true,
  transmitted: true,
  outdoorBytes: true
  }
  );
  TestValidator.equals("supported paths retain their borrowed dry samples", Array.from(dry), [1, 0]);
};
