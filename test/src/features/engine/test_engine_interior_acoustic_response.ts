import {
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
 * Room identities select shared Sabine results, outdoor copying, adopted outcomes and unresolved gaps.
 *
 * Scenarios:
 * 1. Same and different rooms consume the Sabine basis: T60 is0.322 s and20 dB transmission has gain 0.1.
 * 2. Outdoor, unresolved and adopted paths retain distinct outcomes; zero absorption remains unsupported.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls `deriveAutoMovieInteriorAcousticResponse` for same-room, cross-room, outdoor, half-unresolved, adopted-profile and zero-absorption inputs and asserts status, path, T60, a positive direct-to-diffuse ratio and transmission gain; it catches rooms compared by the wrong identity, a cross-room result carrying T60 instead of partition gain, an outdoor pair treated as a room, an adopted profile reported as available without its bytes, and a lossless room given a finite diffuse result.
 * @evidence contracts/testing.md#independent-expectations T60 0.322 s is Sabine `0.161 * 100 / (100 * 0.5)`, gain 0.1 is `10^(-20/20)` for the 20 dB partition, and the outdoor, unsupported and not-run outcomes restate the derivation's documented space rules; the ratio is asserted only to be positive, so its magnitude is not pinned.
 * @evidence contracts/testing.md#distinguishing-cases Positive same-room and cross-room paths; outdoor with both spaces null; unresolved with one; adopted response not run; boundary of zero absorption that has no bounded diffuse field; malformed inputs belong to `test_engine_interior_acoustic_derivation_admission`, absorption ordering to `test_engine_interior_acoustic_material_tail`, and PCM application to `test_engine_interior_acoustic_pcm_paths`.
 */
export const test_engine_interior_acoustic_response = (): void => {
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

  const outdoor = deriveAutoMovieInteriorAcousticResponse({
      sourceSpace: null,
      listenerSpace: null,
      inputRevision: digest,
      request: null,
      profile,
    });

  const unresolved = deriveAutoMovieInteriorAcousticResponse({
      sourceSpace: "room-a",
      listenerSpace: null,
      inputRevision: digest,
      request: null,
      profile,
    });

  const adopted = deriveAutoMovieInteriorAcousticResponse({
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

  const gap = deriveAutoMovieInteriorAcousticResponse({
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
};
