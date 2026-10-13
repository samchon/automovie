import type { IAutoMovieHumanBodyBasis } from "../../body/structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyBasisChannel } from "../../body/structures/shape/IAutoMovieHumanBodyBasisChannel";

/**
 * A copied solve-only body basis with unavailable direct-endpoint channels reported separately and actual paired head support limiting independent channel intervals. Original source envelopes remain unchanged. Dimensionless weights describe interpolation support rather than physiological limits. Unsupported mixed/coupled endpoint ownership refuses in the producer; this record is not a general coupled feasible-domain certificate.
 *
 * @evidence contracts/common.md#principled-implementation Copied available channel ranges, original missing channels and named source reasons preserve actual paired body/head endpoint authority.
 * @evidence contracts/common.md#clear-and-simple-design Basis, omitted-channel list and per-channel limit map separate solve input from diagnostic source explanation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Independent intervals do not silently represent unsupported coupled constraints or rewrite authoring envelopes, and source support is not called clinical reach.
 * @evidence contracts/common.md#meaningful-documentation Prose states dimensionless domains, omission versus shortened ranges, unchanged source and independent-envelope limits.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This result record runs no source-owner analysis or interval derivation; humanPersonBodyReach owns that work.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Retaining a successful solve basis is consumer caching, not memoization implemented by this interface.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The schema acquires no geometry or solve task; the caller owns actual copied channels, borrowed basis members and diagnostic map lifetime.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonBodyReach {
  /** A solve-only body view with the jointly evaluable channel envelopes. */
  basis: IAutoMovieHumanBodyBasis;

  /** Original channels with an unavailable direct body endpoint. */
  missing: IAutoMovieHumanBodyBasisChannel[];

  /** Named source reasons for each shortened channel, keyed by its body id. */
  limits: Map<string, string[]>;
}
