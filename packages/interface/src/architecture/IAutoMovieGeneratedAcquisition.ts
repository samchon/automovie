import { AutoMovieContentDigest } from "../production/AutoMovieContentDigest";

/**
 * Generation identity of bytes that no external source ever served.
 *
 * An image-generation result has no acquisition URL, so recording one would be
 * a fabrication. It has instead a provider, a model, the exact instruction that
 * produced it, the references it was conditioned on, and the digest of the
 * bytes that came back. Sampling is usually irreproducible, and this record
 * states that as a fact rather than repairing it with an invented seed.
 */
export interface IAutoMovieGeneratedAcquisition {
  /** Service or tool identity that produced the bytes. */
  provider: string;

  /** Exact model identity, including a version when it changes output. */
  model: string;

  /** Provider-side request identity, or null when the provider issues none. */
  request: string | null;

  /** Verbatim instruction, or null when only its digest may be published. */
  prompt: string | null;

  /** SHA-256 of the exact instruction bytes, always recorded. */
  promptDigest: AutoMovieContentDigest;

  /**
   * Manifest asset paths this request was conditioned on, in request order.
   * Empty for a text-only request.
   */
  inputs: string[];

  /** SHA-256 of the exact bytes the generator returned. */
  outputDigest: AutoMovieContentDigest;

  /**
   * Whether replaying provider, model, prompt and inputs reproduces
   * {@link outputDigest}. `false` is the honest answer for sampled image
   * generation and is never repaired by inventing a replay handle.
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
