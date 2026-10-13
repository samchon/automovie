/**
 * The checked numerical realm's original source witness changed during startup
 * or before a later command. Stream and HTTP failures retain this identity so
 * their arrival order cannot turn measured invalidation into a generic loss.
 * A fresh candidate can read the new bytes; retrying the rejected realm cannot
 * establish its authority. An unchanged source or numerical error retains its
 * ordinary refusal and never acquires this recovery merely by waiting.
 */
export class HumanViewerNodeSourceChangedError extends Error {}
