/**
 * - `solved`: the fixed-step solve ran and the state is its result.
 * - `rest`: the authored rest configuration was requested and returned as such.
 * - `derived`: a deterministic derivation ran; nothing was integrated over time.
 * - `not-run`: nothing was computed at all, because the record did not validate or the request fell outside what the record declared.
 * - `unsupported`: a declared capability this tier does not provide was asked for, so no solved state is claimed.
 *
 * @evidence contracts/common.md#principled-implementation Closed outcomes preserve integrated solve, explicit rest, deterministic static derivation, unexecuted input and unsupported capability as different computational facts.
 * @evidence contracts/common.md#clear-and-simple-design Status vocabulary complements nullable state and diagnostic records without treating every non-error response as a solved simulation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Rest and derived cannot masquerade as time integration, and not-run or unsupported cannot produce claimed solved evidence through a fallback state.
 * @evidence contracts/common.md#meaningful-documentation Explains every outcome and whether a computation, integration or supported state actually exists.
 */
export type AutoMovieSoftAnalysisStatus =
  | "solved"
  | "rest"
  | "derived"
  | "not-run"
  | "unsupported";
