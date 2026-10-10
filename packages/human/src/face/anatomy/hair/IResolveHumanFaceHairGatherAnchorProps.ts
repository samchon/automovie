import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Neutral angular ray and matched current scalp geometry used to resolve one gathering attachment.
 * The origin is neutral head-frame metres, angles are radians, and resident indices share the admitted source correspondence.
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
