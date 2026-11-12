import type { AutoMovieHarmonicCurve } from "./AutoMovieHarmonicCurve";
import type { AutoMovieLoftCapSource } from "./AutoMovieLoftCapSource";
import type { AutoMovieLoftChain } from "./AutoMovieLoftChain";
import type { AutoMovieLoftCoefficientSource } from "./AutoMovieLoftCoefficientSource";
import type { AutoMovieLoftFrame } from "./AutoMovieLoftFrame";
import type { AutoMovieLoftFrameSource } from "./AutoMovieLoftFrameSource";
import type { AutoMovieLoftParameter } from "./AutoMovieLoftParameter";
import type { AutoMovieLoftSectionConnect } from "./AutoMovieLoftSectionConnect";
import type { AutoMovieLoftSectionSource } from "./AutoMovieLoftSectionSource";
import type { AutoMovieSplineCurve } from "./AutoMovieSplineCurve";
import type { IAutoMovieLoftRelief } from "./IAutoMovieLoftRelief";

/**
 * Principal-layer data of one chain, as published by the observation fitter
 * and consumed by {@link AutoMovieLoftChain}.
 *
 * @evidence contracts/development/design.md#principled-representation Principal values, station jets and optional explicit axis/parameter source records determine every reading; no hidden bind registry changes geometry.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One record of layers and the chain's basis, order, rule, samples and poles.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Optional jets are absent rather than zero-filled, so a reader knows which rule applies.
 * @evidence contracts/development/common.md#meaningful-documentation States field units, absence, actual-axis ownership, numeric-copy equivalence, immutable cache premises and callable-source serialization limits.
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
   * Explicit outward sign of `S_station x S_phase`, when the producer knows
   * the oriented boundary it continues (a join's blend). Absent, a tube's
   * radial direction and mirrored flag decide it. This sign takes precedence
   * over mirrored. Reversing one chart coordinate or reflecting world space
   * reverses it; orientation-preserving rigid motion and translation keep it.
   * The producer still owns regularity of the connected surface: a sign is
   * not a certificate that its chart has no degenerate or folded point.
   */
  orientation?: 1 | -1;

  /**
   * Number of uniform phases of the chain's own rings.
   *
   * Chosen by the fitter from the chain's largest perimeter so vertices are a
   * few millimetres apart; a child switches from its inherited ring to this
   * phase set in its first band.
   */
  samples: number;

  /**
   * The phases of the chain's own rings, radians, strictly increasing within one turn from the first, `samples` of them, when they are not
   * uniform: a section that turns fast over a few phases, as a sole's edge does, takes its rings' vertices closer there. Absent, the
   * `samples` uniform phases `2 pi k / samples`.
   */
  phases?: number[];

  /** Principal layers ordered by strictly increasing height, at least two. */
  layers: IAutoMovieLoftChain.ILayer[];

  /** Original plain scalar field and independent compatibility-row bindings. Present data owns points/phase/jets; stale or broken data throws. Absence retains the legacy basis. Finite values do not imply physical source2 availability. */
  nativeSource?: AutoMovieLoftSectionSource.ISource;

  /** Complete generating laws on spans changed by continuation; other spans keep their original source. Immutable copies preserve these laws and coefficient rewrites must re-express their bindings. */
  sectionSpans?: AutoMovieLoftSectionConnect.ISpan[];

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

    /** Actual original cap owner, retained only while this end and its adjacent boundary survive unchanged. Values and positive-section physical2 have separate admission; JSON cannot restore its callable axis. */
    source?: AutoMovieLoftCapSource.ISource;
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

    /** Same explicit original-cap ownership as pole.source; removing this end removes its extra domain. */
    source?: AutoMovieLoftCapSource.ISource;
  };
}
export namespace IAutoMovieLoftChain {
  /**
   * A principal section value and its explicit station/source interpolation data.
   *
   * @evidence contracts/development/design.md#principled-representation Values and station jets define ordinary Hermite spans; optional common pole-coordinate derivatives and actual-axis records state the supported source interpolation directly.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Section, lift, frame and their derivative/source fields remain one immutable layer datum.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Missing jets are not zero-filled, invalid retained axis data is not silently resplined and source metadata is explicitly removed or transformed at a changed boundary.
   * @evidence contracts/development/common.md#meaningful-documentation Members distinguish mm station derivatives, parameter derivatives, raw view metadata and the callable source's lifetime/copy limits.
   */
  export interface ILayer {
    /**
     * Station of the layer along the chain in mm, strictly increasing over
     * the chain's layers. For a layer without a frame it is the world height
     * of its horizontal section.
     */
    y: number;

    /** Section plane of the layer; absent means horizontal at height `y`. */
    frame?: AutoMovieLoftFrame.IFrame;

    /** Actual immutable axis and independent value/station-jet snapshot. Equal-value copies preserve it; a changed datum must explicitly remove or re-express it. Callable source records cannot be restored by JSON; rebuild them from the authored tree. Null station jets preserve finite source values but do not qualify that boundary for a regular solid 2-jet. */
    frameSource?: AutoMovieLoftFrameSource.ISource;

    /** Direct coefficient derivatives in a common closing root/angle coordinate, with finite virtual zero-pole data. The existing coefficients remain the values; absent/different maps select the ordinary station-Hermite boundary. This is a new principal-coefficient interpolant, not a guarantee of original scalar/fullness fidelity between layers. */
    coefficientSource?: AutoMovieLoftCoefficientSource.ISource;

    /** Complete actual endpoint family, oriented into this station/phase chart and independently bound to these numeric rows. Its physical source2 is a C2 construction premise, separate from ordinary finite Point0. */
    sectionSource?: AutoMovieLoftSectionSource.IEndpoint;

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
     * Second station derivative of every coefficient. Without common explicit
     * coefficientSource data, when both layers of
     * an interval carry it, the interval is the quintic Hermite of their
     * values, slopes and these (`AutoMovieStationHermite`); absent,
     * the cubic Hermite of values and slopes.
     */
    curvatures?: number[];

    /**
     * Station derivatives of the layer's plane, its origin and both axes
     * component by component. Matching actual frameSource records own the
     * intermediate frame instead. Otherwise, when both interval layers carry them,
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
     * layers it emitted from a four-quarter section (a touch/split conic
     * chain's layer has none). The section touches the box at the guide phases 0,
     * `pi / 2`, `pi` and `3 pi / 2`: the point there is the outline's value
     * on its chart axis (a knot of the section's B-spline), so an audit reads
     * the guide-touch rule on the layers that carry it.
     */
    view?: IAutoMovieLoftChain.IView;
  }

  /**
   * The raw view-section inputs retained for a generated layer.
   *
   * @evidence contracts/development/design.md#principled-representation Box, shoulders and guide curvatures describe the admitted section before final phase/station interpolation.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Three four-entry arrays preserve the section owner's quantities without another shape representation.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Raw conic data does not certify final Cartesian spline fidelity, convexity or geometric G2 at a pole.
   * @evidence contracts/development/common.md#meaningful-documentation Members state signed directions, quarter indexing and mm/inverse-mm units.
   */
  export interface IView {
    /** Half extents of the box from the axis along `+u`, `+v`, `-u` and `-v`, mm, positive. */
    extents: [number, number, number, number];

    /** Each quarter's conic shoulder, quarter `q` from guide `q` to guide `q + 1`; `sqrt(2) - 1` the ellipse. */
    shoulders: [number, number, number, number];

    /** The shared curvature of the section at each guide, 1 per mm. */
    curvatures: [number, number, number, number];
  }
}
