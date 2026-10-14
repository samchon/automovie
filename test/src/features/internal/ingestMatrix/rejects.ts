import type { IAutoMovieExternalModelInspection } from "@automovie/ingest";
import { throwsError } from "../predicates";
import { inspect } from "./inspect";
import { humanoidResolver } from "./humanoidResolver";
import { resolveOnlyBuffer } from "./resolveOnlyBuffer";

/**
 * Assert a field-specific inspector refusal through the shared error predicate.
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
