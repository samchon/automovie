import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * A conservative capsule enclosing one emitted shaft segment.
 * Endpoint rings lie within its maximum observed radius; their connecting
 * triangles lie in the convex capsule too. Station identity excludes only
 * comparisons of the same shaft, whose arc owner admits its own curvature.
 *
 * @author Samchon
 */
export interface IHumanFaceLashSegment {
  /** First observed ring centre. */
  from: IAutoMovieVector3;

  /** Next observed ring centre. */
  to: IAutoMovieVector3;

  /** Maximum radius of the two endpoint rings. */
  radius: number;

  /** Distinct shaft identity within the complete emitted population. */
  shaft: number;

  /** Anatomical side and lid row, for a reproducible refusal. */
  population: string;
}
