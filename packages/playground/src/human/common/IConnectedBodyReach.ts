import type {
  IAutoMovieHumanBodyBasis,
  IAutoMovieHumanBodyBasisChannel,
} from "@automovie/human";

/**
 * What the body partition view of a person generation can evaluate, read from its unavailable source targets.
 *
 * Missing endpoint channels are withheld, while channels driving unavailable envelope correctives retain only the evaluable domain. The reach owner constructs this view without mutating the original basis, and measurement controls use it for bracketing rather than treating the original full range as available.
 *
 * @evidence contracts/common.md#principled-implementation A reduced basis, missing channel list and per-channel limitation reasons distinguish absent endpoints from shortened corrective reach, so measured inverses receive only evaluable domains.
 * @evidence contracts/common.md#clear-and-simple-design The record keeps the usable basis and displayed gaps together; the reach function computes them and controls consume them without copying reach logic.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unavailable source targets remain named rather than gaining fabricated endpoint meshes or an unrestricted solver domain.
 * @evidence contracts/common.md#meaningful-documentation The comment distinguishes missing from limited channels, identifies bracketing use and states original-basis mutation ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This reach result type implements no filtering or domain truncation algorithm; the producing reach function owns those traversals.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The result declares no memoization policy or equivalence across source revisions; consumers decide how long one reach view remains valid.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This record retains only basis and limitation data with no worker or renderer handle; the mounting editor owns its reachable lifetime.
 *
 * @author Samchon
 */
export interface IConnectedBodyReach {
  /**
   * The body view with each available channel's domain ending at the onset of any unavailable envelope corrective it drives; channels with an unavailable endpoint are absent. Measured solves bracket in this domain.
   */
  basis: IAutoMovieHumanBodyBasis;

  /** Channels whose own endpoint is unavailable, shown disabled. */
  missing: IAutoMovieHumanBodyBasisChannel[];

  /** Per channel id, the named reasons its domain ends early. */
  limits: Map<string, string[]>;
}
