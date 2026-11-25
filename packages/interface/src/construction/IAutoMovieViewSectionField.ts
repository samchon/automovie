import type { IAutoMovieConicArcField } from "./IAutoMovieConicArcField";
import type { IAutoMovieConicFieldJet } from "./IAutoMovieConicFieldJet";
import type { IAutoMovieViewConic } from "./IAutoMovieViewConic";

/** Data and callback contracts shared by the ViewSectionField operations. */
export namespace IAutoMovieViewSectionField {
  /** Actual scalar [value,ds,dss] in regular physical station mm. */
  export type IStationJet = readonly [number, number, number];

  /** Radial [value,s,phi,ss,sphi,phiphi], with polar angle in radians. */
  export type IRadialJet = [number, number, number, number, number, number];

  /** A reading's result: the radial jet, or the named failure (with `kind`). */
  export type IRead =
    | IAutoMovieViewSectionField.IRadialJet
    | IAutoMovieConicArcField.IFailure;

  /** Immutable, value-copyable preparation of one station's original field. */
  export interface IPrepared {
    /** Distinguishes a successful preparation from a named failure. */
    readonly kind: "prepared";

    /** Actual station source tuples; p is an explicitly constant coordinate. */
    readonly source: IAutoMovieViewConic.ICurve<IAutoMovieConicFieldJet.IJet>;

    /**
     * Numeric values of that same source, without native observation
     * partitions.
     */
    readonly geometry: IAutoMovieViewConic.ICurve;
  }
}
