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
 * Room identities select shared Sabine results, outdoor copying, adopted outcomes and unresolved gaps.
 *
 * Scenarios:
 * 1. Same and different rooms consume the Sabine basis: T60 is0.322 s and20 dB transmission has gain 0.1.
 * 2. Outdoor, unresolved and adopted paths retain distinct outcomes; zero absorption remains unsupported.
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
