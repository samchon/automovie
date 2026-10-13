import { AutoMovieContentDigest } from "../production/AutoMovieContentDigest";

/**
 * Generation identity of bytes that no external source ever served.
 *
 * An image-generation result has no acquisition URL, so recording one would be
 * a fabrication. It has instead a provider, a model, the exact instruction that
 * produced it, the references it was conditioned on, and the digest of the
 * bytes that came back. Sampling is usually irreproducible, and this record
 * states that as a fact rather than repairing it with an invented seed.
 *
 * `validateGeneratedAcquisition` states the rules below, but no production gate
 * calls it today, so an asset manifest's `generated` record is held only to its
 * type. Nothing compares {@link promptDigest} with the hash of a recorded
 * {@link prompt}.
 *
 * @evidence contracts/common.md#principled-implementation `validateGeneratedAcquisition` requires a non-blank provider and model, a null or non-blank request and prompt, lowercase `sha256:` digests, non-blank input paths, an output digest equal to the current bytes when given, and a safe-integer seed, then ties the seed to `reproducible`.
 * @evidence contracts/common.md#clear-and-simple-design The record holds only facts a generator returns or a caller sends, with the prompt text optional beside its always-present digest, so a private prompt is still identified without being published.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No URL or seed is invented for sampled output; the remaining gaps are that no production gate calls the validator and nothing hashes a recorded prompt against its digest, both stated in the documentation.
 * @evidence contracts/common.md#meaningful-documentation States why no URL exists, when each nullable member is null, the input order, the seed's representable range, how `reproducible` and `seed` constrain each other, and that the validator is not wired into a gate.
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
   * Non-blank provider-side request identity, or null when the provider issues
   * none.
   */
  request: string | null;

  /**
   * Non-blank verbatim instruction, or null when only its digest may be
   * published.
   */
  prompt: string | null;

  /** SHA-256 of the exact instruction bytes, always recorded. */
  promptDigest: AutoMovieContentDigest;

  /**
   * Manifest asset paths this request was conditioned on, in request order.
   * Empty for a text-only request. Each must be non-blank; none is resolved
   * against the manifest.
   */
  inputs: string[];

  /** SHA-256 of the exact bytes the generator returned. */
  outputDigest: AutoMovieContentDigest;

  /**
   * Whether replaying provider, model, prompt and inputs reproduces
   * {@link outputDigest}. `false` is the honest answer for sampled image
   * generation and is never repaired by inventing a replay handle.
   *
   * `true` requires a recorded {@link seed}; `false` with a seed is a warning,
   * because that seed does not replay the bytes.
   */
  reproducible: boolean;

  /**
   * Provider-reported seed, or null when the provider exposes none.
   *
   * A recorded seed is a whole number small enough to survive being written
   * down: a fractional, non-finite, or beyond-2^53 value is not the number the
   * provider used, so replaying it would reproduce nothing.
   */
  seed: number | null;
}
