/**
 * Authored acquisition identity of bytes returned by a generator.
 *
 * This record names provider, model, instruction, conditioned references and returned-byte digest rather than a source URL. It does not establish whether a provider served those bytes externally. Reproducibility is an authored assertion; metadata admission checks seed consistency without executing the provider or proving replay.
 *
 * Asset admission runs validateGeneratedAcquisition and hashes a published prompt as exact UTF-8 against promptDigest. Without processing steps, outputDigest must equal the current asset digest. A transformed asset retains the acquisition record, but its current bytes cannot prove the original output.
 *
 * @evidence contracts/common.md#principled-implementation `validateGeneratedAcquisition` requires a non-blank provider and model, a null or non-blank request and prompt, lowercase `sha256:` digests, non-blank input paths, an output digest equal to the current bytes when given, and a safe-integer seed, then ties the seed to `reproducible`.
 * @evidence contracts/common.md#clear-and-simple-design The record holds only facts a generator returns or a caller sends, with the prompt text optional beside its always-present digest, so a private prompt is still identified without being published.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No URL or seed is invented for sampled output; production asset admission validates generation metadata and the published prompt hash, comparing generator output with current bytes only when no processing changed those bytes.
 * @evidence contracts/common.md#meaningful-documentation Defines recorded generator identity, nullable prompt and request, reference order, safe-integer seed consistency without replay proof, UTF-8 prompt hashing and the processed-byte identity limitation.
 * @author Samchon
 */
export interface IAutoMovieGeneratedAcquisition {
  /** Non-blank service or tool identity that produced the bytes. */
  provider: string;

  /**
   * Non-blank exact model identity, including a version when it changes output.
   */
  model: string;

  /**
   * Non-blank provider-side request identity, or null when the provider issues none.
   */
  request: string | null;

  /**
   * Non-blank verbatim instruction, or null when only its digest may be published.
   */
  prompt: string | null;

  /** SHA-256 of the exact instruction bytes, always recorded. */
  promptDigest: string;

  /**
   * Manifest asset paths this request was conditioned on, in request order. Empty for a text-only request. Each must be non-blank; none is resolved against the manifest.
   */
  inputs: string[];

  /** SHA-256 of the exact bytes the generator returned. */
  outputDigest: string;

  /**
   * Authored assertion that replaying the declared generation basis reproduces {@link outputDigest}; the validator performs no replay and does not independently verify this assertion.
   *
   * `true` requires a recorded {@link seed}; `false` with a seed produces a consistency warning. Seed presence alone establishes no repeat-output guarantee.
   */
  reproducible: boolean;

  /**
   * Provider-reported seed, or null when the provider exposes none.
   *
   * Number.isSafeInteger admits integer values from -(2^53 - 1) through 2^53 - 1. Fractional, non-finite and out-of-range values refuse; admission establishes numeric representability rather than provider origin or repeat-output proof.
   */
  seed: number | null;
}
