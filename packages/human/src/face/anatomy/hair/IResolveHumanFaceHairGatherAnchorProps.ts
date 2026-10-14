import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Neutral angular ray and matched current scalp geometry used to resolve one gathering attachment. The origin is neutral head-frame metres, angles are radians, and resident indices share the admitted source correspondence.
 *
 * @evidence contracts/common.md#principled-implementation A neutral angular ray selects an original growth-domain triangle whose weights carry the gather anchor to matched current coordinates.
 * @evidence contracts/common.md#clear-and-simple-design The input exposes neutral and current correspondence without making an independently authored attachment mesh.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Original incidence must remain matched; the resolver refuses a missing or singular ray rather than inventing a scalp anchor.
 * @evidence contracts/common.md#meaningful-documentation origin and coordinates are head metres, polar is from +Y and azimuth from +Z toward +X in radians.
 * @evidenceExclude contracts/performance.md#efficient-algorithms resolveHumanFaceHairGatherAnchor owns ray selection and live seating.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Neutral correspondence is reused for current attachment rather than reidentifying the triangle on each shape.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns surface arrays and angular inputs; resolver output vectors belong to its caller.
 *
 * @author Samchon
 */
export interface IResolveHumanFaceHairGatherAnchorProps {
  /** Neutral growth-chart origin in metres. */
  origin: IAutoMovieVector3;

  /** Neutral source positions in metres. */
  positions: readonly number[];

  /** Matched current source positions in metres. */
  current: readonly number[];

  /** Source triangle corner indices. */
  indices: readonly number[];

  /** Growth-domain triangle ordinals. */
  triangles: readonly number[];

  /** Polar angle from +Y in radians. */
  polar: number;

  /** Azimuth from +Z toward +X in radians. */
  azimuth: number;
}
