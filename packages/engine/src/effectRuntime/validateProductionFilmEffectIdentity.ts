import { SHA256_DIGEST_PATTERN } from "../validation/constants/SHA256_DIGEST_PATTERN";
import { AutoMovieFilmEffectRuntimeError } from "./AutoMovieFilmEffectRuntimeError";
import { IAutoMovieFilmEffectCurrentIdentity } from "./IAutoMovieFilmEffectCurrentIdentity";

/**
 * Refuse a current film-effect identity that cannot address a runtime.
 *
 * The production and film ids must be non-blank and both builder identities
 * must be exact lowercase SHA-256 content digests. The writer checks this
 * before it stamps a runtime and the sampler before it compares one, so a
 * malformed identity is refused as `film-effect-input-invalid` rather than
 * read as a stale match.
 *
 * @evidence contracts/common.md#principled-implementation Ids are checked by trimming to detect whitespace-only strings, and digests by the engine's anchored `SHA256_DIGEST_PATTERN`, which admits exactly `sha256:` plus 64 lowercase hex digits so one content has one spelling and string equality is identity equality.
 * @evidence contracts/common.md#clear-and-simple-design One validator shared by the writer and the sampler, reusing the engine's single digest pattern rather than a local copy, so the two sides cannot disagree about what a well-formed identity is.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uppercase hex, another algorithm or a padded id is refused rather than normalized, and no sentinel identity bypasses the check.
 * @evidence contracts/common.md#meaningful-documentation States both rules, which functions call it and when, and the refusal code and why it is distinct from staleness.
 * @evidence contracts/performance.md#efficient-algorithms Two trims and two anchored pattern tests, linear in the four string lengths, with the pattern compiled once at module load.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure check per call over a caller-owned record; there is no completed work to share.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Allocates only the trimmed strings and retains nothing; the shared pattern has no global flag, so `test` keeps no `lastIndex` state between calls.
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
    SHA256_DIGEST_PATTERN.test(identity.compileFingerprint) === false ||
    SHA256_DIGEST_PATTERN.test(identity.editFingerprint) === false
  )
    throw new AutoMovieFilmEffectRuntimeError(
      "film-effect-input-invalid",
      "Film effect compile and edit identities must be SHA-256 content digests.",
    );
};
