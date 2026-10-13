import { AutoMovieFilmEffectRuntimeError } from "./AutoMovieFilmEffectRuntimeError";
import { IAutoMovieFilmEffectCurrentIdentity } from "./IAutoMovieFilmEffectCurrentIdentity";

/**
 * Refuse a current film-effect identity that cannot address a runtime.
 *
 * The production and film ids must be non-blank and both builder identities
 * must be exact lowercase SHA-256 content digests. The writer checks this
 * before it stamps a runtime and the sampler before it compares one, so a
 * malformed identity is refused as input rather than read as a stale match.
 */
export const validateProductionFilmEffectIdentity = (
  identity: IAutoMovieFilmEffectCurrentIdentity,
): void => {
  if (
    identity.production.trim().length === 0 ||
    identity.film.trim().length === 0
  )
    throw new AutoMovieFilmEffectRuntimeError(
      "film-effect-input-invalid",
      "Film effect production and film identities must be non-blank.",
    );
  if (
    validDigest(identity.compileFingerprint) === false ||
    validDigest(identity.editFingerprint) === false
  )
    throw new AutoMovieFilmEffectRuntimeError(
      "film-effect-input-invalid",
      "Film effect compile and edit identities must be SHA-256 content digests.",
    );
};

const validDigest = (value: string): boolean =>
  /^sha256:[0-9a-f]{64}$/.test(value);
