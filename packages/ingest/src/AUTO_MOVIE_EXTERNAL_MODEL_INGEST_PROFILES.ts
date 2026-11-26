import type { AutoMovieExternalModelIngestProfile } from "@automovie/interface";

/**
 * Every supported ingest profile literal, frozen in declaration order. The
 * complete Record over the closed union supplies exactly four own keys; the
 * profile guard reuses this bounded module-lifetime inventory without deriving
 * another list.
 */
export const AUTO_MOVIE_EXTERNAL_MODEL_INGEST_PROFILES: readonly AutoMovieExternalModelIngestProfile[] =
  Object.freeze(
    Object.keys({
      "gltf-static-v1": true,
      "gltf-humanoid-v1": true,
      "gltf-motion-v1": true,
      "vrm-humanoid-v1": true,
    } satisfies Record<
      AutoMovieExternalModelIngestProfile,
      true
    >) as AutoMovieExternalModelIngestProfile[],
  );
