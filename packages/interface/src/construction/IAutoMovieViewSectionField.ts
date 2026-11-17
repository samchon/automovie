import type { IAutoMovieConicFieldJet } from "./IAutoMovieConicFieldJet";
import type { IAutoMovieViewConic } from "./IAutoMovieViewConic";

/** Data and callback contracts shared by the ViewSectionField operations. */
export namespace IAutoMovieViewSectionField {
  /**
   * Actual scalar [value,ds,dss] in regular physical station mm.
   *
   * @evidence contracts/development/design.md#principled-representation Retains actual first/second station derivatives, with extent values in mm and shoulders dimensionless.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Three entries match the original scalar reader's value and finite station jet.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No singular or unavailable derivative is represented by an invented zero.
   * @evidence contracts/development/common.md#meaningful-documentation States ordering, scalar units and physical station coordinate.
   */
  export type IStationJet = readonly [number, number, number];

  /**
   * Radial [value,s,phi,ss,sphi,phiphi], with polar angle in radians.
   *
   * @evidence contracts/development/design.md#principled-representation Stores total-order-two derivatives of the same radial field, rather than source-p derivatives or a rectangular higher jet.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Six entries suffice for the existing surface product rule.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No source-p/phase substitution or unused higher derivative is implied.
   * @evidence contracts/development/common.md#meaningful-documentation Gives ordering and physical-station/polar coordinate meanings.
   */
  export type IRadialJet = [number, number, number, number, number, number];

  /**
   * Immutable, value-copyable preparation of one station's original field.
   *
   * @evidence contracts/development/design.md#principled-representation Numeric lookup data is a primal projection of explicit source tuples from the shared geometry factory.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Source derivatives and their numeric lookup snapshot remain visible records.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No callback registration or object identity selects geometry; a broken present snapshot is refused.
   * @evidence contracts/development/common.md#meaningful-documentation States station-local ownership, immutability and equal-value copy semantics.
   */
  export interface IPrepared {
    /** Distinguishes a successful preparation from a named failure. */
    readonly kind: "prepared";

    /** Actual station source tuples; p is an explicitly constant coordinate. */
    readonly source: IAutoMovieViewConic.ICurve<IAutoMovieConicFieldJet.IJet>;

    /** Numeric values of that same source, without native observation partitions. */
    readonly geometry: IAutoMovieViewConic.ICurve;
  }
}
