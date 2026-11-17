import type { IAutoMovieConstructionOutlineParameter } from "./IAutoMovieConstructionOutlineParameter";
import type { IAutoMovieNaturalCubicSpline } from "./IAutoMovieNaturalCubicSpline";
import type { IAutoMovieViewHermite } from "./IAutoMovieViewHermite";
import type { IAutoMovieViewPart } from "./IAutoMovieViewPart";

/**
 * Data and callback contracts shared by the ViewOutline operations.
 *
 * @evidence contracts/development/design.md#principled-representation Outline preparation retains original knots and parameter choice; readings distinguish finite scalar values from nullable physical-station jets and their explicit status.
 * @evidence contracts/development/design.md#minimal-and-owned-surface ViewOutline owns source admission/readings used by view curves, scalar sources and optional ViewHermite preparation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Singular or nonfinite station derivatives do not discard a finite source value or fabricate zero derivatives; failures remain named.
 * @evidence contracts/development/common.md#meaningful-documentation Defines closing ends, root/angle coordinates, derivative status and extension location.
 */
export namespace IAutoMovieViewOutline {
  /**
   * Closing stations in millimetres; absent ends remain open.
   *
   * @evidence contracts/development/design.md#principled-representation Names the two possible endpoints of the published pole parameter.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Optional bottom and top numbers represent open, single-pole and two-pole sources.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Missing means open; admission checks each declared endpoint instead of substituting one.
   * @evidence contracts/development/common.md#meaningful-documentation States station units and absent-end meaning.
   */
  export interface IEnds {
    /** Bottom closing station, when present. */
    bottom?: number;

    /** Top closing station, when present. */
    top?: number;
  }

  /**
   * An admitted source curve, independent of any emitted section.
   *
   * @evidence contracts/development/design.md#principled-representation Stores the original named knots and the natural spline in their admitted station or pole parameter.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One record retains source identity, span, closure and prepared scalar spline.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No surviving section, fitted points or mesh observations replace the input knots.
   * @evidence contracts/development/common.md#meaningful-documentation Members distinguish station domain and spline parameter and identify copied inputs.
   */
  export interface IOutline {
    /** Named source knots, copied at admission. */
    knots: readonly IAutoMovieViewPart.IKnot[];

    /** First and last source knot stations, millimetres. */
    domain: readonly [number, number];

    /** Closing stations, copied at admission. */
    ends: Readonly<IAutoMovieViewOutline.IEnds>;

    /** Admitted scalar interpolation parameter; its endpoints need not have zero values unless ends separately closes the part. */
    parameter: IAutoMovieConstructionOutlineParameter | undefined;

    /** Natural spline in the admitted parameter. */
    spline: IAutoMovieNaturalCubicSpline;

    /** Optional explicitly requested shared-jet/range quintic preparation; absent keeps the original natural cubic unchanged. */
    hermite?: IAutoMovieViewHermite.ICurve;
  }

  /**
   * A source premise that failed before a spline could be prepared.
   *
   * @evidence contracts/development/design.md#principled-representation Retains the existing outline or pole-knot construction contract and its input failure.
   * @evidence contracts/development/design.md#minimal-and-owned-surface A contract and detail suffice without an exception or substitute curve.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A failed source remains failed and named.
   * @evidence contracts/development/common.md#meaningful-documentation Identifies the contract discriminator and original input detail.
   */
  export interface IFailure {
    /** Existing construction diagnostic contract. */
    contract: "outline" | "pole knot" | "pole parameter";

    /** The original premise and its input numbers. */
    detail: string;
  }

  /**
   * A finite source value and its explicitly qualified derivatives.
   *
   * @evidence contracts/development/design.md#principled-representation Separates finite position from the station change of parameter, whose derivatives can be singular or exceed binary64 at a pole.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One scalar reading carries both jet units and their availability status.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No finite jet is invented for a singular endpoint and no finite point is hidden for an unrepresentable station derivative.
   * @evidence contracts/development/common.md#meaningful-documentation Members state scalar units, parameter/station derivatives, absence status and tangent extension location.
   */
  export interface IReading {
    /** Requested station, millimetres. */
    station: number;

    /** Station itself by default, otherwise the selected root/angle parameter. */
    parameter: number;

    /** Source scalar, with the outline's own units. */
    value: number;

    /** First and second derivatives in the spline parameter, including at a pole. */
    parameterJet: readonly [number, number];

    /** First and second derivatives in station, absent at a singular parameter endpoint or when their magnitude cannot be represented finitely. */
    stationJet: readonly [number, number] | null;

    /** Why the station jet is present or absent; a finite source point is not discarded for an unrepresentable derivative. */
    stationJetStatus:
      | "regular"
      | "singular-pole"
      | "singular-parameter"
      | "nonfinite";

    /** Knot-span location, parameter-tangent extension, radial closing pole, or a nonclosing singular parameter endpoint. */
    location:
      | "interior"
      | "endpoint"
      | "extension"
      | "pole"
      | "parameter-endpoint";
  }
}
