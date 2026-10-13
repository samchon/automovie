/**
 * - `solved`: the fixed-step solve ran and the state is its result.
 * - `rest`: the authored rest configuration was requested and returned as such.
 * - `derived`: a deterministic derivation ran; nothing was integrated over time.
 * - `not-run`: nothing was computed at all, because the record did not validate
 *   or the request fell outside what the record declared.
 * - `unsupported`: a declared capability this tier does not provide was asked
 *   for, so no solved state is claimed.
 */
export type AutoMovieSoftAnalysisStatus =
  | "solved"
  | "rest"
  | "derived"
  | "not-run"
  | "unsupported";
