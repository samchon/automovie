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
 *
 * @evidence contracts/development/design.md#principled-representation Carry one of unsupported, invalid or digest-mismatch on the Error so receipt consumers classify a verifier refusal by constructor identity and a typed reason rather than prose parsing.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One canonical class is shared by verifyAutoMovieSemanticMask and autoMovieSemanticMaskVerificationFailure; duplicated constructors would break instanceof classification.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The reason comes from actual verifier branches and no expected receipt or fixture changes its classification; unrelated exceptions remain outside this class.
 * @evidence contracts/development/common.md#meaningful-documentation The constructor documents the refusal reason and retains the ordinary message for human diagnosis; classification is independent of message text.
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
