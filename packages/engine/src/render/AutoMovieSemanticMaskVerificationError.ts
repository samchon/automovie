/**
 * A typed refusal carried from the semantic-mask verifier to its callers.
 *
 * The verifier refuses for three distinguishable reasons and the receipt
 * consumer has to tell them apart without reading prose, so the reason travels
 * on the error itself. That only works while there is one class: an error
 * carries the identity of the constructor that made it, so a second copy of
 * this declaration would make `instanceof` false for every error the verifier
 * actually throws, and every refusal would read as an unrelated exception.
 *
 * @evidence requirements/rendering/passes-channels-and-products.md#rendering-identity-mask-channels Distinguishes historical palette compatibility from a current payload whose declared identity is false.
 * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-pass-products Carries the stable refusal classification semantic product receipts consume.
 * @author Samchon
 */
export class AutoMovieSemanticMaskVerificationError extends Error {
  public constructor(
    /** Why the payload was refused, as receipts classify it. */
    public readonly reason: "unsupported" | "invalid" | "digest-mismatch",
    message: string,
  ) {
    super(message);
  }
}
