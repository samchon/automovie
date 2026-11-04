import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Requested placement of a rigid surface sample in one metre coordinate frame.
 * The origin places the sample centroid. The normal fixes its plane; forward
 * is projected into that plane before normalization, so neither vector scales
 * the sample. Zero or parallel directions refuse during placement.
 *
 * @evidence contracts/common.md#principled-implementation An origin and two independent directions determine an oriented rigid frame without introducing scale or changing sample distances.
 * @evidence contracts/common.md#clear-and-simple-design The same structural record describes the prepared source frame and requested destination, while the computation owner admits directions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No actor, support policy or inferred world axis is part of the frame; its directions must be supplied explicitly.
 * @evidence contracts/common.md#meaningful-documentation States metre units, centroid origin, normal priority, projected forward, magnitude independence and degenerate refusal.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased record performs no basis construction or point mapping.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This record defines no cache; the preparation owns reusable source coordinates.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns three vector records; the type acquires no renderer, task or retained history.
 */
export interface IAutoMovieSurfaceFrame {
  /** Sample centroid in the caller's source or destination metre frame. */
  readonly origin: Readonly<IAutoMovieVector3>;

  /** Nonzero in-plane heading, after projection along the supplied normal. */
  readonly forward: Readonly<IAutoMovieVector3>;

  /** Nonzero oriented plane normal, independent of forward. */
  readonly normal: Readonly<IAutoMovieVector3>;
}
