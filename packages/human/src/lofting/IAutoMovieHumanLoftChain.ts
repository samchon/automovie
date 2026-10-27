import type { AutoMovieHumanHarmonicCurve } from "./AutoMovieHumanHarmonicCurve";
import type { AutoMovieHumanLoftChain } from "./AutoMovieHumanLoftChain";
import type { AutoMovieHumanLoftFrame } from "./AutoMovieHumanLoftFrame";
import type { AutoMovieHumanLoftParameter } from "./AutoMovieHumanLoftParameter";
import type { IAutoMovieHumanRelief } from "../network/IAutoMovieHumanRelief";
import type { AutoMovieHumanSplineCurve } from "./AutoMovieHumanSplineCurve";

/**
 * Principal-layer data of one chain, as published by the observation fitter
 * and consumed by {@link AutoMovieHumanLoftChain}.
 */
export interface IAutoMovieHumanLoftChain {
  /** Stable chain name used for part ids and diagnostics. */
  name: string;

  /**
   * Section basis. `spline`: uniform periodic cubic B-spline, see
   * {@link AutoMovieHumanSplineCurve}; absent: truncated Fourier series, see
   * {@link AutoMovieHumanHarmonicCurve}.
   */
  basis?: "spline";

  /**
   * Size of every section's basis: the highest harmonic K, or the number of
   * control points N of a spline chain.
   */
  order: number;

  /** Phase correspondence rule; see {@link AutoMovieHumanLoftParameter}. */
  rule: AutoMovieHumanLoftParameter.Rule;

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
  layers: IAutoMovieHumanLoftChain.ILayer[];

  /**
   * Features written as heights over this chain's surface (the nose and
   * lips over the face, the breasts over the thorax); see
   * {@link IAutoMovieHumanRelief}. Absent means none.
   */
  reliefs?: IAutoMovieHumanRelief[];

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
}
export namespace IAutoMovieHumanLoftChain {
  /** One principal layer: a shape event of the chain. */
  export interface ILayer {
    /**
     * Station of the layer along the chain in mm, strictly increasing over
     * the chain's layers. For a layer without a frame it is the world height
     * of its horizontal section.
     */
    y: number;

    /** Section plane of the layer; absent means horizontal at height `y`. */
    frame?: AutoMovieHumanLoftFrame.IFrame;

    /**
     * Section coefficients in mm, in the layout of the chain's basis
     * ({@link AutoMovieHumanHarmonicCurve} or {@link AutoMovieHumanSplineCurve}).
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
     * Second station derivative of every coefficient. When both layers of
     * an interval carry it, the interval is the quintic Hermite of their
     * values, slopes and these (`AutoMovieHumanStationHermite`); absent,
     * the cubic Hermite of values and slopes.
     */
    curvatures?: number[];

    /**
     * Station derivatives of the layer's plane, its origin and both axes
     * component by component. When both layers of an interval carry them,
     * the plane is the Hermite of the two planes' components, its axes not
     * renormalised, so it moves C2 with the coefficients; absent, the
     * rotation Hermite of `AutoMovieHumanLoftFrame.interpolate`.
     */
    frameSlopes?: AutoMovieHumanLoftFrame.IFrame;

    /** Second station derivatives of the plane's components; with `frameSlopes`, the quintic rule. */
    frameCurvatures?: AutoMovieHumanLoftFrame.IFrame;
  }
}
