/**
 * The softness of one surface's sag proxy: a base value plus a gain for each
 * named body channel times the document's weight of that channel, held in a
 * closed range.
 *
 * @evidence contracts/common.md#principled-implementation A base plus channel-weighted gains, held within a closed interval, determines sag's scalar softness.
 * @evidence contracts/common.md#clear-and-simple-design The softness relation is isolated from the sag reference geometry and smoothing policy.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The scalar is an authored proxy rather than an independently measured tissue modulus.
 * @evidence contracts/common.md#meaningful-documentation Members state zero-channel baseline, gain multiplication and closed-range holding.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The sag softness relation has no runtime implementation that chooses an algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The sag softness relation schema implements no cache or request sharing.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The sag softness relation declaration allocates no runtime state or handles.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodyBasisSurfaceSagSoftness {
  /** Softness with every listed channel at zero. */
  base: number;

  /** Gain per named body channel, multiplied by the document's weight of it. */
  channels: Record<string, number>;

  /** Closed interval the softness is held in. */
  range: [number, number];
}
