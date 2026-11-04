import type { AutoMovieHarmonicCurve } from "./AutoMovieHarmonicCurve";
import type { AutoMovieLoftChain } from "./AutoMovieLoftChain";
import type { AutoMovieLoftFrame } from "./AutoMovieLoftFrame";
import type { AutoMovieLoftParameter } from "./AutoMovieLoftParameter";
import type { IAutoMovieLoftRelief } from "./IAutoMovieLoftRelief";
import type { AutoMovieSplineCurve } from "./AutoMovieSplineCurve";

/**
 * Principal-layer data of one chain, as published by the observation fitter
 * and consumed by {@link AutoMovieLoftChain}.
 *
 * @evidence contracts/common.md#principled-implementation A chain is its principal layers with their station jets, the data every reading of the loft is a function of.
 * @evidence contracts/common.md#clear-and-simple-design One record of layers and the chain's basis, order, rule, samples and poles.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Optional jets are absent rather than zero-filled, so a reader knows which rule applies.
 * @evidence contracts/common.md#meaningful-documentation States every field, its unit and what its absence means.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A type with no runtime body; its readers' costs are on `AutoMovieLoftChain`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A data record; reuse lives in its readers' caches.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The record's size is its layers', owned by its producer.
 */
export interface IAutoMovieLoftChain {
  /** Stable chain name used for part ids and diagnostics. */
  name: string;

  /**
   * Section basis. `spline`: uniform periodic cubic B-spline, see
   * {@link AutoMovieSplineCurve}; absent: truncated Fourier series, see
   * {@link AutoMovieHarmonicCurve}.
   */
  basis?: "spline";

  /**
   * Size of every section's basis: the highest harmonic K, or the number of
   * control points N of a spline chain.
   */
  order: number;

  /** Phase correspondence rule; see {@link AutoMovieLoftParameter}. */
  rule: AutoMovieLoftParameter.Rule;

  /**
   * Whether the chain bounds a hole, such as the pocket under an ear's helix.
   *
   * A hole's sections run clockwise (front toward -Z), so its own rings face
   * into the hole, which is outward from the body there. Phases of a hole's
   * sections, in the fitter and for vertices it inherits, are taken from the
   * outline mirrored as (x, z) -> (x, -z), which makes them increase along the
   * clockwise ring order the zipper expects. Absent means an ordinary tube.
   */
  mirrored?: boolean;

  /**
   * Number of uniform phases of the chain's own rings.
   *
   * Chosen by the fitter from the chain's largest perimeter so vertices are a
   * few millimetres apart; a child switches from its inherited ring to this
   * phase set in its first band.
   */
  samples: number;

  /** Principal layers ordered by strictly increasing height, at least two. */
  layers: IAutoMovieLoftChain.ILayer[];

  /**
   * Features written as heights over this chain's surface (the nose and
   * lips over the face, the breasts over the thorax); see
   * {@link IAutoMovieLoftRelief}. Absent means none.
   */
  reliefs?: IAutoMovieLoftRelief[];

  /**
   * Pole of a cap: the point every section shrinks to at the chain's end
   * station on the cap's side (the angle 0 from the pole axis), where the
   * skin closes by a fan from the ring next to it. Absent for a chain
   * without a cap.
   */
  pole?: {
    /** The chain's end the pole closes. */
    end: "bottom" | "top";

    /** The pole, mm. */
    point: [number, number, number];
  };

  /**
   * The pole of the other end of a chain closed at both (a foot from heel
   * to forefoot cap), as `pole`; the solid tessellation
   * (`AutoMovieHumanBodySurfaceSolids`) closes both ends, the ring loft only
   * `pole`'s. Absent for a chain open at its other end.
   */
  opposite?: {
    /** The chain's end the pole closes, the other than `pole`'s. */
    end: "bottom" | "top";

    /** The pole, mm. */
    point: [number, number, number];
  };
}
export namespace IAutoMovieLoftChain {
  /** One principal layer: a shape event of the chain. */
  export interface ILayer {
    /**
     * Station of the layer along the chain in mm, strictly increasing over
     * the chain's layers. For a layer without a frame it is the world height
     * of its horizontal section.
     */
    y: number;

    /** Section plane of the layer; absent means horizontal at height `y`. */
    frame?: AutoMovieLoftFrame.IFrame;

    /**
     * Section coefficients in mm, in the layout of the chain's basis
     * ({@link AutoMovieHarmonicCurve} or {@link AutoMovieSplineCurve}).
     */
    coefficients: number[];

    /** Height derivative of every coefficient in mm per mm, shared by both adjacent intervals. */
    slopes: number[];

    /**
     * Out-of-plane displacement of a spline section along the frame normal
     * `v x u` (up for a horizontal layer), one value per control point in
     * mm, interpolated over phase by the same B-spline and over station by
     * the same Hermite rule as the coefficients.
     *
     * A fitted specimen's sections lie in their planes, so its layers omit
     * it; a shape law that moves an anatomical point across its station
     * (see `AutoMovieHumanBodyLaw`) writes it. Absent means zero.
     */
    lift?: number[];

    /** Station derivative of every `lift` value in mm per mm; present exactly when `lift` is. */
    liftSlopes?: number[];

    /**
     * Second station derivative of every `lift` value. When both layers of an
     * interval carry it, the lift takes the quintic rule as the coefficients
     * do with `curvatures`; absent, the cubic Hermite of values and slopes.
     */
    liftCurvatures?: number[];

    /**
     * Second station derivative of every coefficient. When both layers of
     * an interval carry it, the interval is the quintic Hermite of their
     * values, slopes and these (`AutoMovieStationHermite`); absent,
     * the cubic Hermite of values and slopes.
     */
    curvatures?: number[];

    /**
     * Station derivatives of the layer's plane, its origin and both axes
     * component by component. When both layers of an interval carry them,
     * the plane is the Hermite of the two planes' components, its axes not
     * renormalised, so it moves C2 with the coefficients; absent, the
     * rotation Hermite of `AutoMovieLoftFrame.interpolate`.
     */
    frameSlopes?: AutoMovieLoftFrame.IFrame;

    /** Second station derivatives of the plane's components; with `frameSlopes`, the quintic rule. */
    frameCurvatures?: AutoMovieLoftFrame.IFrame;

    /**
     * The view box and shoulders the view-to-section operator
     * (`AutoMovieViewLoft`) drew this layer from; present exactly on
     * layers it emitted. The section touches the box at the guide phases 0,
     * `pi / 2`, `pi` and `3 pi / 2`: the point there is the outline's value
     * on its chart axis (a knot of the section's B-spline), so an audit reads
     * the guide-touch rule on the layers that carry it.
     */
    view?: IAutoMovieLoftChain.IView;
  }

  /** What a view-lofted layer was drawn from. */
  export interface IView {
    /** Half extents of the box from the axis along `+u`, `+v`, `-u` and `-v`, mm, positive. */
    extents: [number, number, number, number];

    /** Each quarter's conic shoulder, quarter `q` from guide `q` to guide `q + 1`; `sqrt(2) - 1` the ellipse. */
    shoulders: [number, number, number, number];

    /** The shared curvature of the section at each guide, 1 per mm. */
    curvatures: [number, number, number, number];
  }
}
