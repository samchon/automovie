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
 * Supported room paths apply finite impulse PCM without changing the caller's dry buffer.
 *
 * Scenarios:
 * 1. The same-room impulse retains its dry onset and adds a finite tail; the different-room path applies gain 0.1.
 * 2. Outdoor copying preserves bytes, while all three supported paths retain the caller-owned dry input.
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
