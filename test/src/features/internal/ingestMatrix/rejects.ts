import type { IAutoMovieExternalModelInspection } from "@automovie/ingest";
import { throwsError } from "../predicates";
import { inspect } from "./inspect";
import { humanoidResolver } from "./humanoidResolver";
import { resolveOnlyBuffer } from "./resolveOnlyBuffer";

/**
 * Assert a field-specific inspector refusal through the shared error predicate.
 *
 * Its owning matrix entry executes or asserts the resulting public inspector behavior without source-shape checks.
 * Constants and expected refusals follow glTF 2.0 storage/profile rules rather than sampling implementation output.
 * It preserves the original boundary case and neighboring valid controls through the matrix fact list.
 * This portable test support is called by test_ingest_external_model_validation_matrix, with resident bytes and no process, browser or GPU.
 */
export const rejects: (document: unknown, message: string, profile?: string, resolver?: (uri: string) => Uint8Array | null) => boolean = (
  document: unknown,
  message: string,
  profile: string = "gltf-static-v1",
  resolver?: (uri: string) => Uint8Array | null,
): boolean =>
  throwsError(
    () : IAutoMovieExternalModelInspection =>
      inspect(
        document,
        profile,
        resolver ??
          (profile === "gltf-humanoid-v1"
            ? humanoidResolver
            : resolveOnlyBuffer),
      ),
    message,
  );
