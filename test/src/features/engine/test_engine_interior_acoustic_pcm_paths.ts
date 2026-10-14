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
import { test12ValuesClose } from "../internal/test12ValuesClose";

/**
 * Supported room paths retain an impulse onset and add a delayed tail without changing the caller's dry buffer.
 *
 * Scenarios:
 * 1. The same-room impulse retains its dry onset and adds a nonzero delayed tail; the different-room path applies gain 0.1.
 * 2. Outdoor copying preserves bytes, while all three supported paths retain the caller-owned dry input.
 *
 * @evidence contracts/testing.md#behavioral-verification Derives the three actual supported room paths and applies each to the same impulse, observing retained dry onset, nonzero delayed tail, .1 cross-room gain, byte-identical outdoor copying and unchanged borrowed input.
 * @evidence contracts/testing.md#independent-expectations Literal dry [1,0] and 20 dB partition loss determine onset/input and .1 amplitude expectations independently. Outdoor checks raw buffer bytes; numeric records use the existing shape-preserving zero-tolerance comparator. A nonzero tail alone does not prove all samples finite or measured acoustic fidelity.
 * @evidence contracts/testing.md#distinguishing-cases Preserves same-room, different-room and outdoor twins over the original two-sample mono 100 Hz input; original nclose transmission tolerance and strict nonzero/longer-tail predicates remain unchanged. Unavailable and malformed PCM facts have separate admission units.
 * @evidence contracts/testing.md#execution-ownership This named synchronous unit owns fresh returned arrays and borrows the unchanged dry buffer through the existing fixture, opening no file, audio device, codec process, solver host, renderer, browser or GPU and replacing no foreign method.
 */
export function test_engine_interior_acoustic_pcm_paths(): void {
  const { digest, profile, request }: ReturnType<typeof createInteriorAcousticTestInputs> = createInteriorAcousticTestInputs();

  const same: ReturnType<typeof deriveAutoMovieInteriorAcousticResponse> = deriveAutoMovieInteriorAcousticResponse({
      sourceSpace: "room-a",
      listenerSpace: "room-a",
      inputRevision: digest,
      request: request(),
      profile,
    });

  const across: ReturnType<typeof deriveAutoMovieInteriorAcousticResponse> = deriveAutoMovieInteriorAcousticResponse({
      sourceSpace: "room-a",
      listenerSpace: "room-b",
      inputRevision: digest,
      request: request(),
      profile,
    });

  const outdoor: ReturnType<typeof deriveAutoMovieInteriorAcousticResponse> = deriveAutoMovieInteriorAcousticResponse({
      sourceSpace: null,
      listenerSpace: null,
      inputRevision: digest,
      request: null,
      profile,
    });

  if (same.status !== "available" || across.status !== "available")
      throw new Error("positive acoustic responses unexpectedly unavailable");

  const dry: Float32Array = Float32Array.from([1, 0]);

  const wet: Float32Array = applyAutoMovieInteriorAcousticResponse({
      samples: dry,
      channels: 1,
      sampleRate: 100,
      response: same,
    });

  const transmitted: Float32Array = applyAutoMovieInteriorAcousticResponse({
      samples: dry,
      channels: 1,
      sampleRate: 100,
      response: across,
    });

  const outdoors: Float32Array = applyAutoMovieInteriorAcousticResponse({
      samples: dry,
      channels: 1,
      sampleRate: 100,
      response: outdoor,
    });

  TestValidator.predicate(
  "the bounded tier adds a finite tail, transmits across rooms, and copies outdoors",
  test12ValuesClose(
  {
  wetStartsDry: wet[0],
  wetHasTail: wet.length > dry.length && wet.slice(1).some((x: number): boolean => x !== 0),
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
  ),
  );
  TestValidator.predicate("supported paths retain their borrowed dry samples", test12ValuesClose(Array.from(dry), [1, 0]));
}
