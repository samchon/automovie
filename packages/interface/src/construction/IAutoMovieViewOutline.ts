import type { IAutoMovieConstructionOutlineParameter } from "./IAutoMovieConstructionOutlineParameter";
import type { IAutoMovieNaturalCubicSpline } from "./IAutoMovieNaturalCubicSpline";
import type { IAutoMovieViewHermite } from "./IAutoMovieViewHermite";
import type { IAutoMovieViewPart } from "./IAutoMovieViewPart";

/** Data and callback contracts shared by the ViewOutline operations. */
export namespace IAutoMovieViewOutline {
  /** Closing stations in millimetres; absent ends remain open. */
  export interface IEnds {
    /** Bottom closing station, when present. */
    bottom?: number;

    /** Top closing station, when present. */
    top?: number;
  }

  /** An admitted source curve, independent of any emitted section. */
  export interface IOutline {
    /** Named source knots, copied at admission. */
    knots: readonly IAutoMovieViewPart.IKnot[];

    /** First and last source knot stations, millimetres. */
    domain: readonly [number, number];

    /** Closing stations, copied at admission. */
    ends: Readonly<IAutoMovieViewOutline.IEnds>;

    /**
     * Admitted scalar interpolation parameter; its endpoints need not have zero
     * values unless ends separately closes the part.
     */
    parameter: IAutoMovieConstructionOutlineParameter | undefined;

    /** Natural spline in the admitted parameter. */
    spline: IAutoMovieNaturalCubicSpline;

    /**
     * Optional explicitly requested shared-jet/range quintic preparation;
     * absent keeps the original natural cubic unchanged.
     */
    hermite?: IAutoMovieViewHermite.ICurve;
  }

  /** A source premise that failed before a spline could be prepared. */
  export interface IFailure {
    /** Existing construction diagnostic contract. */
    contract: "outline" | "pole knot" | "pole parameter";

    /** The original premise and its input numbers. */
    detail: string;
  }

  /** An admission's result: the admitted curve, or the failed premise (with `detail`). */
  export type IResult = IAutoMovieViewOutline.IOutline | IAutoMovieViewOutline.IFailure;

  /** A finite source value and its explicitly qualified derivatives. */
  export interface IReading {
    /** Requested station, millimetres. */
    station: number;

    /** Station itself by default, otherwise the selected root/angle parameter. */
    parameter: number;

    /** Source scalar, with the outline's own units. */
    value: number;

    /**
     * First and second derivatives in the spline parameter, including at a
     * pole.
     */
    parameterJet: readonly [number, number];

    /**
     * First and second derivatives in station, absent at a singular parameter
     * endpoint or when their magnitude cannot be represented finitely.
     */
    stationJet: readonly [number, number] | null;

    /**
     * Why the station jet is present or absent; a finite source point is not
     * discarded for an unrepresentable derivative.
     */
    stationJetStatus:
      | "regular"
      | "singular-pole"
      | "singular-parameter"
      | "nonfinite";

    /**
     * Knot-span location, parameter-tangent extension, radial closing pole, or
     * a nonclosing singular parameter endpoint.
     */
    location:
      | "interior"
      | "endpoint"
      | "extension"
      | "pole"
      | "parameter-endpoint";
  }
}
