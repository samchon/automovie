import {
  type IAutoMovieAcousticRequest,
  applyAutoMovieInteriorAcousticResponse,
  deriveAutoMovieInteriorAcousticResponse,
} from "@automovie/engine";
import type { IAutoMovieAcousticResponseProfile } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createInteriorAcousticTestInputs } from "../internal/audio/createInteriorAcousticTestInputs";
import { throwsError } from "../internal/predicates";

/**
 * Unavailable analysis, revision mismatch and malformed room inputs are refused before a response can be consumed.
 *
 * Scenarios:
 * 1. An unavailable response and a mismatched revision are refused by their own boundaries.
 * 2. Blank profiles, malformed digest or solver, space mismatch, missing source/receiver, coincident endpoints and missing partitions retain their original outcomes.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls actual room-response derivation and PCM application, observing unavailable/not-run/unsupported outcomes and named profile/revision/subject/coincidence refusals before an unavailable response can mix.
 * @evidence contracts/testing.md#independent-expectations Authored room/endpoint presence and fixed profile/revision syntax determine expected states and literal refusal fragments. The fixture's revision is declared metadata rather than a recomputed physical-geometry digest; no measured room or audio-device observation is claimed.
 * @evidence contracts/testing.md#distinguishing-cases Preserves unavailable consumption, revision mismatch, blank profile, malformed digest/solver, mixed outdoor binding, absent analysis/source/receiver/partitions, subject mismatch and coincident endpoints without claiming all analyzer-domain branches.
 * @evidence contracts/testing.md#execution-ownership This named synchronous unit owns fresh room requests, a two-sample CPU buffer and local callbacks through the existing canonical fixture; it opens no file, solver process, audio device, renderer, browser or GPU and replaces no foreign method.
 */
export function test_engine_interior_acoustic_derivation_admission(): void {
  const {
    digest,
    profile,
    request,
  }: ReturnType<typeof createInteriorAcousticTestInputs> =
    createInteriorAcousticTestInputs();

  const unresolved: ReturnType<typeof deriveAutoMovieInteriorAcousticResponse> =
    deriveAutoMovieInteriorAcousticResponse({
      sourceSpace: "room-a",
      listenerSpace: null,
      inputRevision: digest,
      request: null,
      profile,
    });

  const dry: Float32Array = Float32Array.from([1, 0]);

  TestValidator.equals(
    "unavailable response and mismatched revisions are refused",
    {
      unavailable: throwsError(
        (): ReturnType<typeof applyAutoMovieInteriorAcousticResponse> =>
          applyAutoMovieInteriorAcousticResponse({
            samples: dry,
            channels: 1,
            sampleRate: 100,
            response: unresolved,
          }),
        "unsupported",
      ),
      revision: throwsError(
        (): ReturnType<typeof deriveAutoMovieInteriorAcousticResponse> =>
          deriveAutoMovieInteriorAcousticResponse({
            sourceSpace: "room-a",
            listenerSpace: "room-a",
            inputRevision:
              "sha256:2222222222222222222222222222222222222222222222222222222222222222" as string,
            request: request(),
            profile,
          }),
        "revision",
      ),
    },
    { unavailable: true, revision: true },
  );

  function derive(
    values: Partial<{
      sourceSpace: string | null;
      listenerSpace: string | null;
      inputRevision: string;
      request: IAutoMovieAcousticRequest | null;
      profile: IAutoMovieAcousticResponseProfile;
    }> = {},
  ): ReturnType<typeof deriveAutoMovieInteriorAcousticResponse> {
    return deriveAutoMovieInteriorAcousticResponse({
      sourceSpace: "room-a",
      listenerSpace: "room-a",
      inputRevision: digest,
      request: request(),
      profile,
      ...values,
    });
  }

  TestValidator.equals(
    "room-response derivation refuses every unresolved or malformed input boundary",
    {
      blankProfile: throwsError(
        (): ReturnType<typeof derive> =>
          derive({ profile: { ...profile, id: " " } }),
        "id must not be blank",
      ),
      badRevision: throwsError(
        (): ReturnType<typeof derive> =>
          derive({
            inputRevision: "not-a-digest" as string,
          }),
        "SHA-256",
      ),
      otherOutdoorEndpoint:
        derive({ sourceSpace: null, listenerSpace: "room-a", request: null })
          .status === "unsupported",
      missingAnalysis: derive({ request: null }).status === "not-run",
      unsupportedSolver: throwsError(
        (): ReturnType<typeof derive> =>
          derive({
            profile: {
              ...profile,
              solver: "other",
            } as unknown as IAutoMovieAcousticResponseProfile,
          }),
        "solver is unsupported",
      ),
      subjectMismatch: throwsError(
        (): ReturnType<typeof derive> =>
          derive({ request: { ...request(), subject: "room-b" } }),
        "does not match source space",
      ),
      missingSource:
        derive({ request: { ...request(), sources: [] } }).status ===
        "unsupported",
      missingReceiver:
        derive({ request: { ...request(), receivers: [] } }).status ===
        "unsupported",
      coincident: throwsError(
        (): ReturnType<typeof derive> =>
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
}
