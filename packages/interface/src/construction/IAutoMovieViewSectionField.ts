import type { IAutoMovieConicArcField } from "./IAutoMovieConicArcField";
import type { IAutoMovieConicFieldJet } from "./IAutoMovieConicFieldJet";
import type { IAutoMovieViewConic } from "./IAutoMovieViewConic";

/** Data and callback contracts shared by the ViewSectionField operations. */
export namespace IAutoMovieViewSectionField {
  /**
   * One scalar's value, first and second derivatives with respect to physical
   * station in millimetres. All three refer to the same regular station. The
   * field role determines the scalar units.
   */
  export type IStationJet = readonly [number, number, number];

  /**
   * Local radial reading ordered [radius, radius_s, radius_φ, radius_ss,
   * radius_sφ, radius_φφ]. Radius and physical station use millimetres. Polar
   * phase uses radians.
   */
  export type IRadialJet = [number, number, number, number, number, number];

  /**
   * Result of reading an original radial field at one phase. An admitted ray
   * returns its six radial components. A failed preparation or query returns
   * the named failure and detail.
   */
  export type IRead =
    | IAutoMovieViewSectionField.IRadialJet
    | IAutoMovieConicArcField.IFailure;

  /**
   * One original regular station's field geometry and derived numeric
   * representation. Use the retained pair together and preserve it during
   * reads. A ray obtained from its numeric geometry can be reused by the
   * derivative reader.
   */
  export interface IPrepared {
    /**
     * Successful preparation marker carried with both source and numeric
     * geometry.
     */
    readonly kind: "prepared";

    /**
     * Conic geometry with actual station derivatives. Its second independent
     * conic coordinate is held constant during preparation.
     */
    readonly source: IAutoMovieViewConic.ICurve<IAutoMovieConicFieldJet.IJet>;

    /**
     * Primal conic geometry from the same prepared source, used to select the
     * native ray.
     */
    readonly geometry: IAutoMovieViewConic.ICurve;
  }
}
