import type { IAutoMovieConvexSupportLoftPlane } from "./IAutoMovieConvexSupportLoftPlane";
import type { IAutoMovieConvexSupportLoftSpan } from "./IAutoMovieConvexSupportLoftSpan";

/**
 * A section family defined by cubic offsets of fixed oriented support planes.
 * At physical Y, the XZ section is the intersection of nx X + nz Z <= h(Y).
 * Offsets and stations use metres; plane normals are dimensionless unit
 * vectors. The intersection describes convex sections, independently of whether
 * the physical source was convex. Empty, unbounded and numerically unresolved
 * sections are outside the generation contract. Ends remain open.
 */
export interface IAutoMovieConvexSupportLoft {
  /** Unique plane identities with outward [nx,nz] unit normals in XZ. */
  planes: IAutoMovieConvexSupportLoftPlane[];

  /** Increasing exactly adjacent physical Y intervals and their offset fields. */
  spans: IAutoMovieConvexSupportLoftSpan[];
}
