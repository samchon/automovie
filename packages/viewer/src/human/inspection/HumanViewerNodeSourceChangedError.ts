/**
 * The checked numerical realm's original source witness changed during startup
 * or before a later command. Stream and HTTP failures retain this identity so
 * their arrival order cannot turn measured invalidation into a generic loss.
 * A fresh candidate can read the new bytes; retrying the rejected realm cannot
 * establish its authority. An unchanged source or numerical error retains its
 * ordinary refusal and never acquires this recovery merely by waiting.
 *
 * @evidence contracts/common.md#principled-implementation Recovery is justified by a measured source or configuration change, not elapsed time or an error-message guess.
 * @evidence contracts/common.md#clear-and-simple-design One error identity carries the host's measured invalidation through the existing endpoint and candidate protocol.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This source-invalidation identity belongs to the measured transport case; numerical refusals keep their ordinary error identity.
 * @evidence contracts/common.md#meaningful-documentation States changed-witness recovery and unchanged-failure behavior.
 */
export class HumanViewerNodeSourceChangedError extends Error {}
