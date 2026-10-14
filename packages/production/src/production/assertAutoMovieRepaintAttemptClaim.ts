import { IAutoMovieRepaintAttemptClaim } from "./IAutoMovieRepaintAttemptClaim";
import { productionRepaintClaimValidatedClaim } from "./productionRepaintClaimValidatedClaim";

/**
 * Refuse malformed claim metadata before project transaction admission. The shared validator checks identity/digest/positive safe ordinal-generation and exact UTC time, then clones the record; this assertion discards that copy. No resident prefix or ownership is acquired here.
 *
 * @evidence contracts/common.md#principled-implementation The claim validator's ordered identity, digest, safe-integer and exact ISO checks gate the subsequent transaction without mutating supplied metadata.
 * @evidence contracts/common.md#clear-and-simple-design A void assertion exposes admission while the identity validator owns field checks and the project owns reservation state.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A metadata-valid claim is not an acquired lock or current prefix, and malformed/proxy/clone failures propagate rather than permit provider dispatch.
 * @evidence contracts/common.md#meaningful-documentation Prose distinguishes metadata checks, discarded clone and resident transaction ownership.
 * @evidence contracts/performance.md#efficient-algorithms Cost includes identifier/digest scans, Date parsing and the existing complete structuredClone even though this wrapper discards its result; cloning is not constant-size if unvalidated extra fields are supplied.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each mutable claim is validated anew and this wrapper owns no request cache or transaction coordinator.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Validation keys/date and the discarded clone are call-local; the borrowed claim remains caller-owned and no lock or provider task is retained.
 */
export const assertAutoMovieRepaintAttemptClaim: (claim: IAutoMovieRepaintAttemptClaim) => void = (
  claim: IAutoMovieRepaintAttemptClaim,
): void => {
  productionRepaintClaimValidatedClaim(claim);
};
