import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * A conservative capsule enclosing one emitted shaft segment. Endpoint rings lie within its maximum observed radius; their connecting triangles lie in the convex capsule too. Station identity excludes only comparisons of the same shaft, whose arc owner admits its own curvature.
 *
 * @evidence contracts/common.md#principled-implementation Adjacent observed ring centres and maximum endpoint radius conservatively enclose a emitted connecting band.
 * @evidence contracts/common.md#clear-and-simple-design Shaft identity distinguishes inter-shaft comparison from the arc owner's same-shaft curvature admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Conservative capsule separation is stricter than actual surface nonintersection and carries no clinical diameter inference.
 * @evidence contracts/common.md#meaningful-documentation Endpoints and radius use current head metres, population text names a reproducible side/row refusal.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Extraction and narrow-phase distance occur in assertHumanFaceLashContact.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The original segment is shared between hierarchy entries and distance checks rather than reconstructed from cells.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The synchronous contact owner retains segment vectors for one check only; no persistent collider is acquired by the type.
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
