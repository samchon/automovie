import type { IAutoMovieFilmEffectCurrentIdentity } from "@automovie/interface";

import { AutoMovieEngineSha256DigestPattern } from "../../validation/AutoMovieEngineSha256DigestPattern";
import { AutoMovieEngineFilmEffectRuntimeError } from "../AutoMovieEngineFilmEffectRuntimeError";

/*
 * Refuse a current film-effect identity that cannot address a runtime.
 *
 * Both builder identities must be exact lowercase SHA-256 content digests. The
 * writer checks this before it stamps a runtime and the sampler before it
 * compares one, so a malformed identity is refused as `film-effect-input-invalid` rather than read
 * as a stale match.
 */
export const validateProductionFilmEffectIdentity = (
  identity: IAutoMovieFilmEffectCurrentIdentity,
): void => {
  if (
    AutoMovieEngineSha256DigestPattern.test(identity.compileFingerprint) === false ||
    AutoMovieEngineSha256DigestPattern.test(identity.editFingerprint) === false
  )
    throw new AutoMovieEngineFilmEffectRuntimeError(
      "film-effect-input-invalid",
      "Film effect compile and edit identities must be SHA-256 content digests.",
    );
};
