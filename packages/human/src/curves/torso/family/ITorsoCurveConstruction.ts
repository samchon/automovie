import type { IAutoMovieCurve64 as C } from "@automovie/engine";

import type { IAutoMovieCurveRegion64 as R } from "../../IAutoMovieCurveRegion64";
import type { TorsoFamily } from "./TorsoFamily";

/**
 * Actual torso construction result and boundary arithmetic diagnostics. Positions use world millimetres; decoded physical full-J uses mm/mm. Raw collar derivatives instead use their explicit normalized longitudinal parameter.
 *
 * @author Samchon
 */
export interface ITorsoCurveConstruction {
  /** Generated world-space cubic primitives and three actual owned boundary publications. */
  delivery: R.Result;

  /** Exact real upstream neck object consumed by construction. */
  consumedNeck: C.Boundary;

  /** The same neck section with J reevaluated from generated Q=P-5J and delta=-5 mm. */
  decodedNeck: C.Boundary;

  /** Actual owner P/Q/delta and decoded derivatives before conversion to a physical millimetre chart. */
  rawCollars: Readonly<
    Record<
      string,
      {
        /** Actual world section controls in millimetres. */
        p: readonly C.Span[];

        /** Generated adjacent world controls in millimetres using the declared longitudinal delta. */
        q: readonly C.Span[];

        /** Signed longitudinal parameter displacement used to generate and decode Q. */
        delta: number;

        /** One derivative vector per section control, in position units per declared longitudinal parameter. */
        fullJ: readonly C.Span[];

        /** Mean decoded tangent projection onto the actual collar normal; divides raw J to publish mm/mm derivatives. */
        physicalMmPerParameter: number;
      }
    >
  >;

  /** The same actual support/handle interpolation family used by the generated sections, guides and waist boundary. */
  family: TorsoFamily;

  /** Maximum bilateral lower-mass-border approximation discrepancy in millimetres at only t=.2,.5,.8 of each approximating piece; this is not a continuous error bound. */
  foldMaximumSelectedApproximationErrorMm: number;
}
