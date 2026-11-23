/**
 * Reason an engine semantic-mask verifier refuses a supplied payload.
 *
 * `unsupported` identifies an unrecognized version or protocol. `invalid`
 * identifies a violation of the supported payload schema. `digest-mismatch`
 * means the structurally admitted payload's declared digest differs from the
 * digest computed from its canonical contents. Unrelated exceptions are not
 * converted into one of these reasons merely because their messages look
 * similar.
 */
export type AutoMovieSemanticMaskVerificationErrorReason =
  | "unsupported"
  | "invalid"
  | "digest-mismatch";
