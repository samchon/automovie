import {
  type IAutoMovieAcousticRequest,
  applyAutoMovieInteriorAcousticResponse,
  deriveAutoMovieInteriorAcousticResponse,
} from "@automovie/engine";
import type {
  AutoMovieContentDigest,
  IAutoMovieAcousticResponseProfile,
} from "@automovie/interface";
import {
  TestValidator,
} from "@nestia/e2e";
import {
  throwsError,
} from "../internal/predicates";

import { createInteriorAcousticTestInputs } from "../internal/audio/createInteriorAcousticTestInputs";

/**
 *
 * Unavailable analysis, revision mismatch and malformed room inputs are refused before a response can be consumed.
 *
 * Scenarios:
 * 1. An unavailable response and a mismatched revision are refused by their own boundaries.
 * 2. Blank profiles, malformed digest or solver, space mismatch, missing source/receiver, coincident endpoints and missing partitions retain their original outcomes.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls `deriveAutoMovieInteriorAcousticResponse` with one input broken at a time and `applyAutoMovieInteriorAcousticResponse` on an unresolved response, asserting either the refusal message fragment or the returned `unsupported` or `not-run` status; it catches a mismatched input revision or a request for another room accepted as this room's analysis, an unsupported solver run anyway, coincident source and listener turned into an infinite level, and a cross-room path with no partition reported as available.
 * @evidence contracts/testing.md#independent-expectations Each expected outcome restates the derivation's documented rule: both spaces present with one endpoint null is unsupported coupling, no request is not-run, a digest outside the SHA-256 form or another revision is refused, and the inverse-square law has no value at zero distance; messages are matched by fragment, so wording changes outside the fragment are not caught.
 * @evidence contracts/testing.md#distinguishing-cases Negatives only, each a one-field change of the shared supported request: blank profile id, malformed and mismatched revisions, an unsupported solver, a subject from another room, empty sources and receivers, a coincident receiver, an empty partition list across rooms, a missing request and a half-outdoor pair; the supported same-room, cross-room, outdoor and adopted results belong to `test_engine_interior_acoustic_response`, and PCM-side refusals to `test_engine_interior_acoustic_pcm_admission`.
 */
export const test_engine_interior_acoustic_derivation_admission = (): void => {
  const { digest, profile, request } = createInteriorAcousticTestInputs();

  const unresolved = deriveAutoMovieInteriorAcousticResponse({
      sourceSpace: "room-a",
      listenerSpace: null,
      inputRevision: digest,
      request: null,
      profile,
    });

  const dry = Float32Array.from([1, 0]);

  TestValidator.equals(
      "unavailable response and mismatched revisions are refused",
      {
        unavailable: throwsError(
          () =>
            applyAutoMovieInteriorAcousticResponse({
              samples: dry,
              channels: 1,
              sampleRate: 100,
              response: unresolved,
            }),
          "unsupported",
        ),
        revision: throwsError(
          () =>
            deriveAutoMovieInteriorAcousticResponse({
              sourceSpace: "room-a",
              listenerSpace: "room-a",
              inputRevision:
                "sha256:2222222222222222222222222222222222222222222222222222222222222222" as AutoMovieContentDigest,
              request: request(),
              profile,
            }),
          "revision",
        ),
      },
      { unavailable: true, revision: true },
    );

  const derive = (
      values: Partial<{
        sourceSpace: string | null;
        listenerSpace: string | null;
        inputRevision: AutoMovieContentDigest;
        request: IAutoMovieAcousticRequest | null;
        profile: IAutoMovieAcousticResponseProfile;
      }> = {},
    ) =>
      deriveAutoMovieInteriorAcousticResponse({
        sourceSpace: "room-a",
        listenerSpace: "room-a",
        inputRevision: digest,
        request: request(),
        profile,
        ...values,
      });

  TestValidator.equals(
      "room-response derivation refuses every unresolved or malformed input boundary",
      {
        blankProfile: throwsError(
          () => derive({ profile: { ...profile, id: " " } }),
          "id must not be blank",
        ),
        badRevision: throwsError(
          () =>
            derive({
              inputRevision: "not-a-digest" as AutoMovieContentDigest,
            }),
          "SHA-256",
        ),
        otherOutdoorEndpoint:
          derive({ sourceSpace: null, listenerSpace: "room-a", request: null })
            .status === "unsupported",
        missingAnalysis: derive({ request: null }).status === "not-run",
        unsupportedSolver: throwsError(
          () =>
            derive({
              profile: {
                ...profile,
                solver: "other",
              } as unknown as IAutoMovieAcousticResponseProfile,
            }),
          "solver is unsupported",
        ),
        subjectMismatch: throwsError(
          () => derive({ request: { ...request(), subject: "room-b" } }),
          "does not match source space",
        ),
        missingSource:
          derive({ request: { ...request(), sources: [] } }).status ===
          "unsupported",
        missingReceiver:
          derive({ request: { ...request(), receivers: [] } }).status ===
          "unsupported",
        coincident: throwsError(
          () =>
            derive({
              request: {
                ...request(),
                receivers: [{ id: "listener", position: { x: 0, y: 0, z: 0 } }],
              },
            }),
          "inverse square law has no value",
        ),
        noPartition:
          derive({
            listenerSpace: "room-b",
            request: { ...request(), partitions: [] },
          }).status === "unsupported",
      },
      {
        blankProfile: true,
        badRevision: true,
        otherOutdoorEndpoint: true,
        missingAnalysis: true,
        unsupportedSolver: true,
        subjectMismatch: true,
        missingSource: true,
        missingReceiver: true,
        coincident: true,
        noPartition: true,
      },
    );
};
