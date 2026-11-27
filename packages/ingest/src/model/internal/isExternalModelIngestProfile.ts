import type { AutoMovieExternalModelIngestProfile } from "@automovie/interface";

import { AUTO_MOVIE_EXTERNAL_MODEL_INGEST_PROFILES } from "./AUTO_MOVIE_EXTERNAL_MODEL_INGEST_PROFILES";

/*
 * Whether an untyped selection, such as a command-line or manifest value, names
 * one supported ingest profile exactly.
 *
 * Only an exact element of the frozen profile list passes, so `toString` and
 * other inherited names are refused.
 * Parameter value: Candidate selection of any type.
 * Returns: `true` when `value` is one of the profile literals.
 */
export function isExternalModelIngestProfile(
  value: unknown,
): value is AutoMovieExternalModelIngestProfile {
  return (
    typeof value === "string" &&
    AUTO_MOVIE_EXTERNAL_MODEL_INGEST_PROFILES.includes(
      value as AutoMovieExternalModelIngestProfile,
    )
  );
}
