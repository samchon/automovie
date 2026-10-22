import type {
  IAutoMovieContourLoft64,
  IAutoMovieCurve64,
} from "@automovie/engine/geometry/curve";

import type { IAutoMovieRecoverySectionReport } from "./IAutoMovieRecoverySectionReport";
import type { IAutoMovieRecoverySectionsInput } from "./IAutoMovieRecoverySectionsInput";
import type { IAutoMovieRecoverySourceTerminal } from "./IAutoMovieRecoverySourceTerminal";

/**
 * Source-free fitted curves at explicitly requested physical planes. Empty sections, all closed components, open fits and rejected-contour diagnostics remain in request order. This collection declares no between-plane topology, continuation, selection or surface authorization.
 *
 * @evidence contracts/common.md#principled-implementation Exact plane cuts and the existing material-side orientation and cubic fitter supply observed coefficients with original physical span widths.
 * @evidence contracts/common.md#clear-and-simple-design Curves, fit reports and one declared frame form a named finite observation collection independently of automatic sweep topology.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Source vertices, triangle arrays and normals are absent; empty or open observations are not silently capped or replaced.
 * @evidence contracts/common.md#meaningful-documentation States request ordering, millimetre coordinates, normalized frame, original direction inputs and the absence of inferred continuation.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased output performs no computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The record owns no cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Coefficient and metadata arrays transfer to the caller without source geometry references.
 */
export interface IAutoMovieRecoverySections {
  /** Collection identity used in every curve name. */
  name: string;

  /** Original caller direction, before normalization; a fresh millimetre-frame triple. */
  axis: IAutoMovieCurve64.Vector;

  /** Original caller frame reference, before orthogonal projection; a fresh triple. */
  reference: IAutoMovieCurve64.Vector;

  /** Actual right-handed orthonormal frame; coordinates measure along n from originMm and u cross v equals n. */
  frame: {
    originMm: IAutoMovieCurve64.Vector;
    n: IAutoMovieCurve64.Vector;
    u: IAutoMovieCurve64.Vector;
    v: IAutoMovieCurve64.Vector;
  };

  /** Every requested plane in original order, including empty cuts; curves retain measured winding. */
  sections: IAutoMovieContourLoft64.ISection[];

  /** Same-order fit diagnostics, open curves and isolated contacts. */
  reports: IAutoMovieRecoverySectionReport[];

  /** Fit and incidence policy without source arrays. */
  policy: Pick<
    IAutoMovieRecoverySectionsInput,
    | "toleranceMm"
    | "maxSpans"
    | "exactCoordinateAliases"
    | "sourceOrientationSign"
    | "cornerDegrees"
  >;

  /** Actual requested planes, raw observations admitted to successful fits and fitted cubic spans. */
  summary: { sections: number; observations: number; spans: number };

  /** Present only when terminalSeeds were requested; observed source extrema and critical qualification do not constitute generated caps or inferred loop continuation. */
  terminals?: IAutoMovieRecoverySourceTerminal[];
}
