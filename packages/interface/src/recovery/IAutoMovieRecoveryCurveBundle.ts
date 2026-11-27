import type { IAutoMovieCubicBezierCurve64 } from "../geometry/IAutoMovieCubicBezierCurve64";
import type {
  IAutoMovieRecoveryAnalyticDomain,
  IAutoMovieRecoveryHermiteCurve,
  IAutoMovieRecoveryTensorFamily,
} from "..";

/**
 * A saved recovery record whose cubic curves a basis conversion rewrites: the
 * declared places a recovery artifact carries curves, every one optional so a
 * polyline fit, a section set, a mesh observation, a tensor-family bundle or an
 * analytic publication each conforms. Every other field of the record passes
 * through a conversion unchanged.
 *
 * The runtime admission owner is `convertRecoveryCurves` in
 * `@automovie/recovery`, which refuses a cubic without one positive phase
 * width per span.
 */
export interface IAutoMovieRecoveryCurveBundle {
  /** The one curve of a polyline fit or a curve override. */
  curve?: IAutoMovieRecoveryCurveBundle.Curve;

  /** The closed loops of a contour loft, by section. */
  loft?: { sections: readonly IAutoMovieRecoveryCurveBundle.ISection[] };

  /** The closed loops of an observed section set, by section. */
  sections?: readonly IAutoMovieRecoveryCurveBundle.ISection[];

  /** The open arcs of each section's report. */
  reports?: readonly { open: readonly { curve: IAutoMovieRecoveryCurveBundle.Curve }[] }[];

  /** The replacement curves of an analytic publication. */
  curveOverrides?: readonly { curve: IAutoMovieRecoveryCurveBundle.Curve }[];

  /** Tensor families whose boundary controls a conversion reissues. */
  tensorFamilies?: readonly IAutoMovieRecoveryTensorFamily[];

  /** Analytic domains whose bound controls a conversion reissues. */
  analyticDomains?: readonly IAutoMovieRecoveryAnalyticDomain[];
}

export namespace IAutoMovieRecoveryCurveBundle {
  /** A saved cubic in either coefficient basis. */
  export type Curve = IAutoMovieCubicBezierCurve64 | IAutoMovieRecoveryHermiteCurve;

  /** One section's closed loops. */
  export interface ISection {
    /** The loops, each with its curve. */
    loops: readonly { curve: Curve }[];
  }
}
