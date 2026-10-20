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
 * @evidence contracts/common.md#principled-implementation Carry one of unsupported, invalid or digest-mismatch on the Error so receipt consumers classify a verifier refusal by constructor identity and a typed reason rather than prose parsing.
 * @evidence contracts/common.md#clear-and-simple-design One canonical class is shared by verifyAutoMovieSemanticMask and autoMovieSemanticMaskVerificationFailure; duplicated constructors would break instanceof classification.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The reason comes from actual verifier branches and no expected receipt or fixture changes its classification; unrelated exceptions remain outside this class.
 * @evidence contracts/common.md#meaningful-documentation The constructor documents the refusal reason and retains the ordinary message for human diagnosis; classification is independent of message text.
 * @evidence contracts/performance.md#efficient-algorithms Constructing/classifying one error is fixed structural work aside from message/stack storage managed by the runtime.
 * @evidence contracts/performance.md#reuse-equivalent-work Consumers reuse the same imported constructor identity; each refusal creates a distinct error rather than sharing mutable exception state.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The catcher owns the error for its reporting lifetime; the class opens no native handle or retry task and retains only reason/message/stack.
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
