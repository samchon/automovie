import type { IAutoMovieLoftCapSource } from "./IAutoMovieLoftCapSource";
import type { IAutoMovieLoftCoefficientSource } from "./IAutoMovieLoftCoefficientSource";
import type { IAutoMovieLoftFrameSource } from "./IAutoMovieLoftFrameSource";
import type { IAutoMovieLoftParameter } from "./IAutoMovieLoftParameter";
import type { IAutoMovieLoftPhaseReading } from "./IAutoMovieLoftPhaseReading";
import type { IAutoMovieLoftRelief } from "./IAutoMovieLoftRelief";
import type { IAutoMovieLoftSectionConnect } from "./IAutoMovieLoftSectionConnect";
import type { IAutoMovieLoftSectionFrame } from "./IAutoMovieLoftSectionFrame";
import type { IAutoMovieLoftSectionSource } from "./IAutoMovieLoftSectionSource";

/**
 * Principal sections, chart conventions and explicit generating sources for a
 * lofted surface chain. Keep the chain and nested source data stable while
 * point and jet readers retain them. After changing a bound layer, re-express
 * or release the binding through its owning operation. Construction admits the
 * principal station order; a retained original cap can extend the readable
 * domain.
 */
export interface IAutoMovieLoftChain {
  /**
   * Stable identifier used when reporting the loft chain and naming its
   * generated parts.
   */
  name: string;

  /**
   * Section coefficient basis. Explicit spline selects the uniform periodic
   * cubic B-spline. Omit it for the truncated Fourier basis.
   */
  basis?: "spline";

  /**
   * Highest retained harmonic for the Fourier basis, or number of controls per
   * local coordinate for the spline basis.
   */
  order: number;

  /**
   * Polygon correspondence used to assign phases to section and inherited ring
   * vertices.
   */
  rule: IAutoMovieLoftParameter.Rule;

  /**
   * Mark a hole boundary whose rings progress clockwise. Its correspondence
   * uses the outline with local v negated. Omit the flag for the ordinary tube
   * convention.
   */
  mirrored?: boolean;

  /**
   * Explicit outward sign of the station-by-phase cross product, taking
   * precedence over mirrored. Choose the sign for the oriented boundary being
   * continued. Coordinate reversal or world reflection reverses the sign; rigid
   * orientation-preserving motion retains it.
   */
  orientation?: 1 | -1;

  /**
   * Positive integer ring vertex count. It fixes the length of an explicit
   * phases list or the number of uniform phases. The section basis order is
   * independent.
   */
  samples: number;

  /**
   * Optional ring vertex phases in radians, in strictly increasing order within
   * one turn from the first phase. Supply exactly samples entries. Omission
   * uses 2πk/samples for k from zero through samples minus one.
   */
  phases?: number[];

  /**
   * At least two principal layers in increasing physical station millimetres.
   * The layer station also gives world height for an unframed horizontal
   * section.
   */
  layers: IAutoMovieLoftChain.ILayer[];

  /**
   * Original prepared scalar data with independent compatibility bindings. When
   * present it owns native point and derivative reads on its valid intervals;
   * the reader rejects stale bindings. Omission leaves the legacy basis
   * available.
   */
  nativeSource?: IAutoMovieLoftSectionSource.ISource;

  /**
   * Explicit generating laws on station intervals changed by continuation.
   * Intervals outside these spans keep their original ownership. Rebind a span
   * when its contributing layer data change.
   */
  sectionSpans?: IAutoMovieLoftSectionConnect.ISpan[];

  /**
   * Height fields composed over the base chain in their respective station and
   * phase windows. Omit the list for a bare surface.
   */
  reliefs?: IAutoMovieLoftRelief[];

  /**
   * Closed end and its collapsed [x, y, z] world-millimetre point. The optional
   * retained source supplies an original cap beyond the nearest principal
   * layer. Omit the field for an open primary end. The source retains a
   * callable axis and must be rebuilt from authored data after JSON
   * serialization.
   */
  pole?: {
    /** The chain's end the pole closes. */
    end: "bottom" | "top";

    /**
     * The collapsed pole [x,y,z] in world millimetres, in the same frame as the
     * chain's placed sections.
     */
    point: [number, number, number];

    /**
     * Actual original cap owner, retained only while this end and its adjacent
     * boundary survive unchanged. Values and positive-section physical2 have
     * separate admission; JSON cannot restore its callable axis.
     */
    source?: IAutoMovieLoftCapSource.ISource;
  };

  /**
   * Second closed end of a chain with two caps, with the same world pole and
   * optional retained-source layout as pole. Omit it when the other end is
   * open.
   */
  opposite?: {
    /** The chain's end the pole closes, the other than `pole`'s. */
    end: "bottom" | "top";

    /**
     * The collapsed pole [x,y,z] in world millimetres, in the same frame as the
     * chain's placed sections.
     */
    point: [number, number, number];

    /**
     * Same explicit original-cap ownership as pole.source; removing this end
     * removes its extra domain.
     */
    source?: IAutoMovieLoftCapSource.ISource;
  };
}

/**
 * Principal layer records, retained view data and phase-only sampling of a
 * chain.
 */
export namespace IAutoMovieLoftChain {
  /**
   * One principal section at a physical station, with coefficients, frame and
   * optional derivatives or retained source records. Coefficients and slopes
   * use the selected chain basis in the same order. Changing a value covered by
   * a retained source requires updating its binding.
   */
  export interface ILayer {
    /**
     * Layer station in physical millimetres along the chain. For an unframed
     * horizontal section this is its world height.
     */
    y: number;

    /**
     * Section origin and world directions for this layer. Omission uses a
     * horizontal frame at height y.
     */
    frame?: IAutoMovieLoftSectionFrame;

    /**
     * Actual view axis and independent frame snapshot bound to this layer.
     * Retain the callable source and unchanged snapshot for analytic reads. A
     * null station jet allows a frame value without second-order station
     * derivatives. Rebuild the callback from authored axis data after JSON
     * serialization.
     */
    frameSource?: IAutoMovieLoftFrameSource.ISource;

    /**
     * Coefficient slopes and curvatures in a shared closing root or angle
     * coordinate, with virtual closed endpoints. Missing or differing maps
     * leave the interval on ordinary physical-station Hermite interpolation.
     */
    coefficientSource?: IAutoMovieLoftCoefficientSource.ISource;

    /**
     * Actual native or basis endpoint family expressed in this layer's station
     * and phase chart and bound to its independent coefficient snapshot.
     */
    sectionSource?: IAutoMovieLoftSectionSource.IEndpoint;

    /**
     * Local section coefficients in millimetres in the order required by the
     * chain's basis.
     */
    coefficients: number[];

    /**
     * First physical-station derivative of each coefficient, in millimetres per
     * millimetre and in coefficient order.
     */
    slopes: number[];

    /**
     * Spline control heights in millimetres along v × u, the frame normal. Use
     * one height per spline control. Phase and station interpolate the heights;
     * omission means zero lift.
     */
    lift?: number[];

    /**
     * First physical-station derivative of each lift control, in millimetres
     * per millimetre. Supply this row with lift.
     */
    liftSlopes?: number[];

    /**
     * Second physical-station derivatives of lift controls in inverse
     * millimetres. Values at both interval endpoints select quintic lift
     * interpolation; otherwise lift interpolates its values and slopes
     * cubically.
     */
    liftCurvatures?: number[];

    /**
     * Second physical-station coefficient derivatives in inverse millimetres.
     * Without a shared explicit coefficient source, use quintic Hermite
     * interpolation when both endpoints carry curvature and cubic values and
     * slopes otherwise.
     */
    curvatures?: number[];

    /**
     * First physical-station derivatives of the frame components. Origin is in
     * millimetres per millimetre and axes in inverse millimetres. A common
     * retained axis takes precedence; otherwise slopes at both ends allow
     * component Hermite interpolation. Component interpolation preserves the
     * calculated axes without renormalizing them.
     */
    frameSlopes?: IAutoMovieLoftSectionFrame;

    /**
     * Second physical-station derivatives of the frame components. Origin is in
     * inverse millimetres and axes in inverse squared millimetres. With slopes
     * at both ends, these enable quintic component interpolation where no
     * common axis owns the frame.
     */
    frameCurvatures?: IAutoMovieLoftSectionFrame;

    /**
     * Original box, shoulder and guide-curvature values retained by ViewLoft
     * for a layer generated from a four-quarter section. Touch or split chains
     * use their own preparation.
     */
    view?: IAutoMovieLoftChain.IView;
  }

  /**
   * Inputs underlying a four-quarter ViewLoft layer. The cyclic values
   * correspond to guide phases zero, π/2, π and 3π/2 and to their following
   * quarters.
   */
  export interface IView {
    /**
     * Positive half-extents in chart millimetres along +u, +v, −u and −v in
     * that order.
     */
    extents: [number, number, number, number];

    /**
     * Dimensionless conic shoulder values in quarter order, each from its guide
     * to the next. A share of √2 − 1 gives the ellipse convention.
     */
    shoulders: [number, number, number, number];

    /** Section curvature at each guide in cyclic order, in inverse millimetres. */
    curvatures: [number, number, number, number];
  }

  /**
   * Read world position and phase tangent repeatedly at one prepared physical
   * station. The input is the chain correspondence phase in radians. The
   * returned vectors are fresh and include frame, applicable lift and relief.
   * The capability retains its station preparation while it is in use.
   */
  export type IPhaseSamplerResult = (t: number) => IAutoMovieLoftPhaseReading;
}
