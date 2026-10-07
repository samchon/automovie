import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * A conservative capsule enclosing one emitted shaft segment.
 * Endpoint rings lie within its maximum observed radius; their connecting
 * triangles lie in the convex capsule too. Station identity excludes only
 * comparisons of the same shaft, whose arc owner admits its own curvature.
 *
 * @evidence contracts/common.md#principled-implementation A convex capsule encloses both tube endpoint rings and their connecting triangles.
 * @evidence contracts/common.md#clear-and-simple-design One geometric bound carries endpoints, radius and owning shaft identity.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Radius is observed from emitted rings rather than enlarged to hide a crossing.
 * @evidence contracts/common.md#meaningful-documentation States the conservative bound and same-shaft identity.
 * @evidence contracts/modeling.md#spatial-conventions Endpoints and radius are canonical head-frame metres.
 * @evidenceExclude contracts/anatomy.md#anatomical-source A geometric bound, not a tissue measurement.
 * @evidenceExclude contracts/anatomy.md#permitted-range The contact owner judges combinations.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Defines no authoring input.
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
