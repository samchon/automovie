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
 * @evidence contracts/common.md#principled-implementation Records generation identity instead of a URL: provider, model, optional request id and prompt, prompt and output digests, ordered inputs, a reproducibility claim, and an optional seed; the validator requires a safe-integer seed, a seed when reproducible, and warns on a seed beside an irreproducible claim.
 * @evidence contracts/common.md#clear-and-simple-design One flat record with null for facts a provider does not expose; `promptDigest` is always required so a withheld prompt is still identified.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts `validateGeneratedAcquisition` is exported but called by no production gate, and no check ties `promptDigest` to `prompt`; both gaps are stated here, not compensated for.
 * @evidence contracts/common.md#meaningful-documentation States each null meaning, what each digest covers, input ordering, the honest reproducibility answer, the seed constraints, and that the validator is not wired into compilation.
 * @author Samchon
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
