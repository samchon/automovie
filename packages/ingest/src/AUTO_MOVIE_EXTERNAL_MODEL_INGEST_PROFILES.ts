import type { AutoMovieExternalModelIngestProfile } from "./AutoMovieExternalModelIngestProfile";

/** Runtime registry whose `Record` type requires exactly the union's keys. */
const INGEST_PROFILE_REGISTRY: Readonly<
  Record<AutoMovieExternalModelIngestProfile, true>
> = {
  "gltf-static-v1": true,
  "gltf-humanoid-v1": true,
  "gltf-motion-v1": true,
  "vrm-humanoid-v1": true,
};

/**
 * Every supported ingest profile literal, frozen in declaration order. The complete Record over the closed union supplies exactly four own keys; the profile guard reuses this bounded module-lifetime inventory without deriving another list.
 *
 * @author Samchon
 */
export const AUTO_MOVIE_EXTERNAL_MODEL_INGEST_PROFILES: readonly AutoMovieExternalModelIngestProfile[] =
  Object.freeze(
    Object.keys(
      INGEST_PROFILE_REGISTRY,
    ) as AutoMovieExternalModelIngestProfile[],
  );
