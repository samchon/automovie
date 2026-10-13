import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * A shared source-owned bone-local articulation or tissue attachment site.
 *
 * @evidence contracts/common.md#principled-implementation A stable bone-local site address and metre position join articulation and attachment owners within the same source rest frame.
 * @evidence contracts/common.md#clear-and-simple-design Site geometry, acquisition account and qualification remain together so consumers reuse one named boundary rather than independent positions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Source annotations preserve their acquisition limitations and do not imply a reconstructed individual's hidden anatomy.
 * @evidence contracts/common.md#meaningful-documentation Member comments give stable cross-owner identity, owning-bone frame, protocol locator and authored-reference qualification.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A site descriptor supplies a point without running attachment registration or geometric fitting.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Stable site names express shared input ownership rather than reuse of completed posed-site calculations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Site coordinates and provenance strings own no mesh population or native registration handle.
 * @author Samchon
 */
export interface IAutoMovieHumanBodySourceSite {
  /** Stable site name referenced by the joint, muscle, connective and skin owners. */
  id: string;

  /** Source annotation in the owning bone's rest-local metre frame. */
  position: IAutoMovieVector3;

  /** Actual quantity/annotation protocol and source locator; no personal reconstruction is implied. */
  account: string;

  /** Source or authored-reference qualification preserved with the site. */
  qualification: string;
}
