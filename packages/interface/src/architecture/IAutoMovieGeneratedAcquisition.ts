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
 * @evidence requirements/external-inputs/source-selection-and-provider-neutrality.md#external-source-acquisition-failure Exposes `IAutoMovieGeneratedAcquisition` as the portable data boundary for the external source acquisition failure requirement.
 * @evidence specifications/interchange-and-adoption/intake-authority-and-routing.md#interchange-acquisition-failure-envelope Types `IAutoMovieGeneratedAcquisition` for the interchange acquisition failure envelope system contract.
 */
export interface IAutoMovieGeneratedAcquisition {
  /**
   * Service or tool identity that produced the bytes.
   *
   * @evidence requirements/external-inputs/source-selection-and-provider-neutrality.md#external-source-acquisition-failure Exposes `provider` as the portable data boundary for the external source acquisition failure requirement.
   * @evidence specifications/interchange-and-adoption/intake-authority-and-routing.md#interchange-acquisition-failure-envelope Types `provider` for the interchange acquisition failure envelope system contract.
   */
  provider: string;
  /**
   * Exact model identity, including a version when it changes output.
   *
   * @evidence requirements/external-inputs/source-selection-and-provider-neutrality.md#external-source-acquisition-failure Exposes `model` as the portable data boundary for the external source acquisition failure requirement.
   * @evidence specifications/interchange-and-adoption/intake-authority-and-routing.md#interchange-acquisition-failure-envelope Types `model` for the interchange acquisition failure envelope system contract.
   */
  model: string;
  /**
   * Provider-side request identity, or null when the provider issues none.
   *
   * @evidence requirements/external-inputs/source-selection-and-provider-neutrality.md#external-source-acquisition-failure Exposes `request` as the portable data boundary for the external source acquisition failure requirement.
   * @evidence specifications/interchange-and-adoption/intake-authority-and-routing.md#interchange-acquisition-failure-envelope Types `request` for the interchange acquisition failure envelope system contract.
   */
  request: string | null;
  /**
   * Verbatim instruction, or null when only its digest may be published.
   *
   * @evidence requirements/external-inputs/source-selection-and-provider-neutrality.md#external-source-acquisition-failure Exposes `prompt` as the portable data boundary for the external source acquisition failure requirement.
   * @evidence specifications/interchange-and-adoption/intake-authority-and-routing.md#interchange-acquisition-failure-envelope Types `prompt` for the interchange acquisition failure envelope system contract.
   */
  prompt: string | null;
  /**
   * SHA-256 of the exact instruction bytes, always recorded.
   *
   * @evidence requirements/external-inputs/source-selection-and-provider-neutrality.md#external-source-acquisition-failure Exposes `promptDigest` as the portable data boundary for the external source acquisition failure requirement.
   * @evidence specifications/interchange-and-adoption/intake-authority-and-routing.md#interchange-acquisition-failure-envelope Types `promptDigest` for the interchange acquisition failure envelope system contract.
   */
  promptDigest: AutoMovieContentDigest;
  /**
   * Manifest asset paths this request was conditioned on, in request order.
   * Empty for a text-only request.
   *
   * @evidence requirements/external-inputs/source-selection-and-provider-neutrality.md#external-source-acquisition-failure Exposes `inputs` as the portable data boundary for the external source acquisition failure requirement.
   * @evidence specifications/interchange-and-adoption/intake-authority-and-routing.md#interchange-acquisition-failure-envelope Types `inputs` for the interchange acquisition failure envelope system contract.
   */
  inputs: string[];
  /**
   * SHA-256 of the exact bytes the generator returned.
   *
   * @evidence requirements/external-inputs/source-selection-and-provider-neutrality.md#external-source-acquisition-failure Exposes `outputDigest` as the portable data boundary for the external source acquisition failure requirement.
   * @evidence specifications/interchange-and-adoption/intake-authority-and-routing.md#interchange-acquisition-failure-envelope Types `outputDigest` for the interchange acquisition failure envelope system contract.
   */
  outputDigest: AutoMovieContentDigest;
  /**
   * Whether replaying provider, model, prompt and inputs reproduces
   * {@link outputDigest}. `false` is the honest answer for sampled image
   * generation and is never repaired by inventing a replay handle.
   *
   * @evidence requirements/external-inputs/source-selection-and-provider-neutrality.md#external-source-acquisition-failure Exposes `reproducible` as the portable data boundary for the external source acquisition failure requirement.
   * @evidence specifications/interchange-and-adoption/intake-authority-and-routing.md#interchange-acquisition-failure-envelope Types `reproducible` for the interchange acquisition failure envelope system contract.
   */
  reproducible: boolean;
  /**
   * Provider-reported seed, or null when the provider exposes none.
   *
   * A recorded seed is a whole number small enough to survive being written
   * down: a fractional, non-finite, or beyond-2^53 value is not the number the
   * provider used, so replaying it would reproduce nothing.
   *
   * @evidence requirements/external-inputs/source-selection-and-provider-neutrality.md#external-source-acquisition-failure Exposes `seed` as the portable data boundary for the external source acquisition failure requirement.
   * @evidence specifications/interchange-and-adoption/intake-authority-and-routing.md#interchange-acquisition-failure-envelope Types `seed` for the interchange acquisition failure envelope system contract.
   */
  seed: number | null;
}
