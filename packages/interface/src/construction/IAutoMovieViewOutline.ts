import type { IAutoMovieConstructionOutlineParameter } from "./IAutoMovieConstructionOutlineParameter";
import type { IAutoMovieNaturalCubicSpline } from "./IAutoMovieNaturalCubicSpline";
import type { IAutoMovieViewHermite } from "./IAutoMovieViewHermite";
import type { IAutoMovieViewPart } from "./IAutoMovieViewPart";

/** Data and callback contracts shared by the ViewOutline operations. */
export namespace IAutoMovieViewOutline {
  /**
   * Requested closing stations for a length-valued view outline. Supply each
   * declared tip in millimetres. A missing side remains open. Closing requires
   * that side's limiting source knot at the tip with absolute value at most
   * 0.005 times the largest absolute source-knot value.
   */
  export interface IEnds {
    /** Closing bottom station in millimetres, when requested. */
    bottom?: number;

    /** Closing top station in millimetres, when requested. */
    top?: number;
  }

  /**
   * Prepared outline with the original named knots and their scalar
   * interpolation. Retain the preparation to read values or derivative
   * capabilities at physical stations. Natural interpolation is the default.
   * Authored knot jets or range constraints select a prepared quintic.
   */
  export interface IOutline {
    /**
     * Original named source knots copied during preparation, in increasing
     * station order.
     */
    knots: readonly IAutoMovieViewPart.IKnot[];

    /**
     * First and last source knot stations in millimetres. These bounds describe
     * the knot span.
     */
    domain: readonly [number, number];

    /** Copied physical stations of declared radial tips in millimetres. */
    ends: Readonly<IAutoMovieViewOutline.IEnds>;

    /**
     * Prepared station-to-root or station-to-angle map with kernel-millimetre
     * endpoints. Undefined uses station directly.
     */
    parameter: IAutoMovieConstructionOutlineParameter | undefined;

    /**
     * Natural cubic interpolation of the source values in the prepared source
     * coordinate.
     */
    spline: IAutoMovieNaturalCubicSpline;

    /**
     * Prepared shared-knot quintic used for authored jets or range admission.
     * Omit it for a natural cubic read.
     */
    hermite?: IAutoMovieViewHermite.ICurve;
  }

  /**
   * Source admission refusal before outline preparation succeeds. The
   * diagnostic preserves the category and producer's numeric detail.
   */
  export interface IFailure {
    /**
     * Category of source refusal, selected from outline, pole knot and pole
     * parameter.
     */
    contract: "outline" | "pole knot" | "pole parameter";

    /**
     * Producer's explanation of the refused premise, including the relevant
     * source values.
     */
    detail: string;
  }

  /**
   * Result of preparing an original outline. A prepared value includes knots
   * and interpolation data. A refusal carries detail and its diagnostic
   * category.
   */
  export type IResult =
    | IAutoMovieViewOutline.IOutline
    | IAutoMovieViewOutline.IFailure;

  /**
   * Original scalar outline value and derivative information at a physical
   * station. The parameter jet uses the source interpolation coordinate. The
   * station jet uses millimetres and can be absent at singular or
   * unrepresentable conversions. The status explains why.
   */
  export interface IReading {
    /** Requested physical station in millimetres. */
    station: number;

    /**
     * Mapped interpolation coordinate of the query. With the default mapping
     * this equals station.
     */
    parameter: number;

    /**
     * Source scalar in the containing outline's units. A declared collapsed
     * pole reads zero.
     */
    value: number;

    /**
     * First and second derivative in the interpolation coordinate, retained at
     * parameter endpoints.
     */
    parameterJet: readonly [number, number];

    /**
     * First and second derivatives with respect to millimetre station, or null
     * when a station-coordinate conversion is unavailable.
     */
    stationJet: readonly [number, number] | null;

    /**
     * Regular when both station derivatives are available. Otherwise reports a
     * closing pole, other singular parameter endpoint or unrepresentable
     * station derivatives.
     */
    stationJetStatus:
      | "regular"
      | "singular-pole"
      | "singular-parameter"
      | "nonfinite";

    /**
     * Physical source location as interior, knot endpoint, tangent extension,
     * closed pole or another singular parameter endpoint.
     */
    location:
      | "interior"
      | "endpoint"
      | "extension"
      | "pole"
      | "parameter-endpoint";
  }
}
