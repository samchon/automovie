/**
 * Reason an engine semantic-mask verifier refuses a supplied payload.
 *
 * `unsupported` identifies an unrecognized version or protocol. `invalid` identifies a violation of the supported payload schema. `digest-mismatch` means the structurally admitted payload's declared digest differs from the digest computed from its canonical contents. Unrelated exceptions are not converted into one of these reasons merely because their messages look similar.
 *
 * @evidence contracts/development/design.md#principled-representation The closed string union preserves the verifier's protocol, schema and content-integrity branches as distinct outcomes.
 * @evidence contracts/development/design.md#minimal-and-owned-surface verifyAutoMovieSemanticMask emits these reasons and autoMovieSemanticMaskVerificationFailure classifies the engine error by constructor identity before reading them.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The type neither duplicates the Error subclass nor substitutes a reason for actual verification of the payload.
 * @evidence contracts/development/common.md#meaningful-documentation Defines each refusal and explains why ordinary exceptions remain outside this classification.
 */
export type AutoMovieSemanticMaskVerificationErrorReason =
  | "unsupported"
  | "invalid"
  | "digest-mismatch";
