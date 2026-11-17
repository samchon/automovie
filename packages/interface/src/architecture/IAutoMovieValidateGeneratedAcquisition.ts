import type { IAutoMovieGeneratedAcquisition } from "./IAutoMovieGeneratedAcquisition";

/**
 * Data and callback contracts shared by the ValidateGeneratedAcquisition operations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Validate authored generation metadata beside a supplied output-digest identity. Member documentation states the supplied records, units and absence meanings used by validateGeneratedAcquisition.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The metadata gate does not invoke a provider or prove replay; seed presence is checked against the claimed reproducibility without inventing a provider-specific seed domain.
 * @evidence contracts/development/design.md#principled-representation acquisition records provider/model/input provenance and an optional safe-integer seed; digest is the expected output identity or null after recorded local transformation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface interface owns IAutoMovieValidateGeneratedAcquisition, used by validateGeneratedAcquisition. Its IProps members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
 */
export namespace IAutoMovieValidateGeneratedAcquisition {
  /**
   * Validate authored generation metadata beside a supplied output-digest identity.
   *
   * A record claiming reproducibility must carry a seed, while a seed beside a false reproducibility claim produces a consistency warning. Presence is evidence that the field was recorded; this gate invokes no provider and proves neither replay nor whether the output was externally served.
   *
   * A seed must be a safe integer within ±(2^53-1), so adjacent integer identities survive JSON-number transport; fractional, nonfinite and larger-magnitude values are refused before the presence/warning rules. The actual provider's seed domain remains outside this metadata gate.
   *
   * Provider and model must be non-blank, present request ids and prompts non-blank, and both digests lowercase `sha256:` hex. A supplied digest must equal outputDigest. Findings use `$input` paths; an irreproducible seed is a non-blocking warning. Input slots, including holes, are visited by index and checked for nonblank strings without resolving paths. Non-throwing collection assumes the declared acquisition/container and string shapes; malformed runtime containers can throw before findings are returned.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Validate authored generation metadata beside a supplied output-digest identity. Member documentation states the supplied records, units and absence meanings used by validateGeneratedAcquisition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The metadata gate does not invoke a provider or prove replay; seed presence is checked against the claimed reproducibility without inventing a provider-specific seed domain.
   * @evidence contracts/development/design.md#principled-representation acquisition records provider/model/input provenance and an optional safe-integer seed; digest is the expected output identity or null after recorded local transformation.
   * @evidence contracts/development/design.md#minimal-and-owned-surface interface owns IAutoMovieValidateGeneratedAcquisition.IProps, used by validateGeneratedAcquisition. Its acquisition, digest members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
   */
  export type IProps = {
    /** Generation identity recorded for one set of returned bytes. */
    acquisition: IAutoMovieGeneratedAcquisition;

    /** Digest the returned bytes must still have, or null after a recorded local transformation. */
    digest: string | null;
  };
}
