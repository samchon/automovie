/**
 * A requested humeral-head reading that was not produced. Skin-crossing means the contact instrument found a crossing and the preview declines containment; it does not classify every possible surface defect. Ct-domain means the radius producer returned no heads under its available adult prior/input domain, rather than a measured radius of zero.
 *
 * @evidence contracts/common.md#principled-implementation A closed refusal reason distinguishes known skin contact from the radius owner's unavailable domain, without fabricating clearance values.
 * @evidence contracts/common.md#clear-and-simple-design The record is the unavailable branch of the preview anatomy union, separate from not-requested null.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A missing fit remains unavailable rather than replacing the requested anatomy with a guessed valid result.
 * @evidence contracts/common.md#meaningful-documentation The prose defines the observed crossing and prior-domain scope and distinguishes refusal from a zero reading.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This refusal record runs no crossing or prior calculation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type neither caches nor retries unavailable anatomy.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources No mesh buffers or running queries are owned by this scalar refusal schema.
 *
 * @author Samchon
 */
export interface IConnectedBodyUnavailableAnatomy {
  /** No anatomy reading was produced. */
  status: "unavailable";

  /** Why the reading is unavailable. */
  reason: "skin-crossing" | "ct-domain";
}
