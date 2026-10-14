import { deriveAutoMovieInteriorAcousticResponse } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { createInteriorAcousticTestInputs } from "../internal/audio/createInteriorAcousticTestInputs";
import { nclose } from "../internal/predicates";

/**
 * Room identities select shared Sabine results, outdoor copying, adopted outcomes and unresolved gaps.
 *
 * Scenarios:
 * 1. Same and different rooms consume the Sabine basis: T60 is0.322 s and20 dB transmission has gain 0.1.
 * 2. Outdoor, unresolved and adopted paths retain distinct outcomes; zero absorption remains unsupported.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls real room-response derivation for same/different/outdoor/unresolved/adopted and zero-absorption inputs, observing path/status distinctions, expected Sabine T60/transmission gain and a positive direct/diffuse ratio.
 * @evidence contracts/testing.md#independent-expectations V=100, area=100 and alpha=.5 independently imply T60=.322 seconds; 20 dB partition loss implies amplitude .1. The fixture declares revision metadata without proving a physical geometry digest, and positive ratio is only a sign witness rather than its exact acoustic value.
 * @evidence contracts/testing.md#distinguishing-cases Preserves all original room-binding/adopted/outdoor/gap twins and default nclose tolerances; absent adopted bytes remain not-run and a perfect reflector remains unsupported. PCM application, finite-domain admission and playback have separate owners.
 * @evidence contracts/testing.md#execution-ownership This named synchronous unit owns fresh requests and response records through the existing canonical fixture; it opens no file, adopted-response decoder, native solver/audio device, renderer, browser or GPU and replaces no foreign method.
 */
export function test_engine_interior_acoustic_response(): void {
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

  TestValidator.equals(
    "same-room and cross-room paths consume the shared Sabine analysis",
    {
      sameStatus: same.status,
      samePath: same.status === "available" ? same.path : null,
      reverberation:
        same.status === "available"
          ? nclose(same.reverberationTimeSeconds!, 0.322)
          : false,
      ratio: same.status === "available" && same.directToDiffuseRatio! > 0,
      acrossStatus: across.status,
      acrossPath: across.status === "available" ? across.path : null,
      transmission:
        across.status === "available"
          ? nclose(across.transmissionGain!, 0.1)
          : false,
    },
    {
      sameStatus: "available",
      samePath: "same-room",
      reverberation: true,
      ratio: true,
      acrossStatus: "available",
      acrossPath: "different-room",
      transmission: true,
    },
  );

  const outdoor: ReturnType<typeof deriveAutoMovieInteriorAcousticResponse> =
    deriveAutoMovieInteriorAcousticResponse({
      sourceSpace: null,
      listenerSpace: null,
      inputRevision: digest,
      request: null,
      profile,
    });

  const unresolved: ReturnType<typeof deriveAutoMovieInteriorAcousticResponse> =
    deriveAutoMovieInteriorAcousticResponse({
      sourceSpace: "room-a",
      listenerSpace: null,
      inputRevision: digest,
      request: null,
      profile,
    });

  const adopted: ReturnType<typeof deriveAutoMovieInteriorAcousticResponse> =
    deriveAutoMovieInteriorAcousticResponse({
      sourceSpace: "room-a",
      listenerSpace: "room-b",
      inputRevision: digest,
      request: null,
      profile: {
        kind: "adopted-response",
        id: "external-ir",
        asset: "assets/ir.wav",
        digest,
        sampleRate: 48_000,
        roomMappings: [
          { source: "room-a", listener: "room-b", response: "a-to-b" },
        ],
      },
    });

  TestValidator.equals(
    "outdoor, unresolved, and adopted-byte paths stay distinct",
    {
      outdoor: outdoor.status === "available" ? outdoor.path : null,
      unresolved:
        unresolved.status === "unsupported" ? unresolved.path : "wrong",
      adopted: adopted.status,
    },
    { outdoor: "outdoor", unresolved: null, adopted: "not-run" },
  );

  const gap: ReturnType<typeof deriveAutoMovieInteriorAcousticResponse> =
    deriveAutoMovieInteriorAcousticResponse({
      sourceSpace: "room-a",
      listenerSpace: "room-a",
      inputRevision: digest,
      request: request(0),
      profile,
    });

  TestValidator.equals(
    "a room without a bounded diffuse result remains unsupported",
    gap.status,
    "unsupported",
  );
}
