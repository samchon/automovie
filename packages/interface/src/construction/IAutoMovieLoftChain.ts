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
 * Principal layers and explicit source owners of one lofted chain.
 *
 * View lofts, fitted sections and continuation operators publish this record
 * for AutoMovieLoftChain and AutoMovieLoftJet. A published chain and its nested
 * arrays/source records must remain unchanged while readers retain it: point
 * and jet caches key preparations by chain identity and physical station.
 * Copies with equal numeric data retain source bindings; changing values
 * requires the owning operator to re-express or remove those bindings. The
 * interface does not freeze or validate storage; construction operators own
 * admission, and readers reject stale explicit owners when reached.
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
  rule: IAutoMovieLoftParameter.Rule;

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
   * Explicit outward sign of `S_station x S_phase`, when the producer knows the
   * oriented boundary it continues (a join's blend). Absent, a tube's radial
   * direction and mirrored flag decide it. This sign takes precedence over
   * mirrored. Reversing one chart coordinate or reflecting world space reverses
   * it; orientation-preserving rigid motion and translation keep it. The
   * producer still owns regularity of the connected surface: a sign is not a
   * certificate that its chart has no degenerate or folded point.
   */
  orientation?: 1 | -1;

  /**
   * Number of vertices in the chain's own rings, a positive integer chosen by
   * the producer. Without phases the vertices use uniform correspondence
   * angles; with phases this is the required list length. It is separate from
   * the section basis order and does not itself certify a geometric spacing
   * tolerance.
   */
  samples: number;

  /**
   * The phases of the chain's own rings, radians, strictly increasing within
   * one turn from the first, `samples` of them, when they are not uniform: a
   * section that turns fast over a few phases, as a sole's edge does, takes its
   * rings' vertices closer there. Absent, the `samples` uniform phases `2 pi k
   * / samples`.
   */
  phases?: number[];

  /**
   * At least two principal layers in strictly increasing physical station, mm.
   * This is world height only for horizontal unframed sections; construction
   * owns minimum-gap admission.
   */
  layers: IAutoMovieLoftChain.ILayer[];

  /**
   * Original plain scalar field and independent compatibility-row bindings.
   * Present data owns points/phase/jets; stale or broken data throws. Absence
   * retains the legacy basis. Finite values do not imply physical source2
   * availability.
   */
  nativeSource?: IAutoMovieLoftSectionSource.ISource;

  /**
   * Complete generating laws on spans changed by continuation; other spans keep
   * their original source. Immutable copies preserve these laws and coefficient
   * rewrites must re-express their bindings.
   */
  sectionSpans?: IAutoMovieLoftSectionConnect.ISpan[];

  /**
   * Features written as heights over this chain's surface (the nose and lips
   * over the face, the breasts over the thorax); see
   * {@link IAutoMovieLoftRelief}. Absent means none.
   */
  reliefs?: IAutoMovieLoftRelief[];

  /**
   * Pole of a cap: the point every section shrinks to at the chain's end
   * station on the cap's side (the angle 0 from the pole axis), where the skin
   * closes by a fan from the ring next to it. Absent for a chain without a
   * cap.
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
   * The pole of the other end of a chain closed at both (a foot from heel to
   * forefoot cap), as `pole`; the solid tessellation
   * (`AutoMovieHumanBodySurfaceSolids`) closes both ends, the ring loft only
   * `pole`'s. Absent for a chain open at its other end.
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
   * A principal section value and its explicit station/source interpolation
   * data.
   */
  export interface ILayer {
    /**
     * Station of the layer along the chain in mm, strictly increasing over the
     * chain's layers. For a layer without a frame it is the world height of its
     * horizontal section.
     */
    y: number;

    /** Section plane of the layer; absent means horizontal at height `y`. */
    frame?: IAutoMovieLoftSectionFrame;

    /**
     * Actual immutable axis and independent value/station-jet snapshot.
     * Equal-value copies preserve it; a changed datum must explicitly remove or
     * re-express it. Callable source records cannot be restored by JSON;
     * rebuild them from the authored tree. Null station jets preserve finite
     * source values but do not qualify that boundary for a regular solid
     * 2-jet.
     */
    frameSource?: IAutoMovieLoftFrameSource.ISource;

    /**
     * Direct coefficient derivatives in a common closing root/angle coordinate,
     * with finite virtual zero-pole data. The existing coefficients remain the
     * values; absent/different maps select the ordinary station-Hermite
     * boundary. This is a new principal-coefficient interpolant, not a
     * guarantee of original scalar/fullness fidelity between layers.
     */
    coefficientSource?: IAutoMovieLoftCoefficientSource.ISource;

    /**
     * Complete actual endpoint family, oriented into this station/phase chart
     * and independently bound to these numeric rows. Its physical source2 is a
     * C2 construction premise, separate from ordinary finite Point0.
     */
    sectionSource?: IAutoMovieLoftSectionSource.IEndpoint;

    /**
     * Section coefficients in mm, in the layout of the chain's basis
     * ({@link AutoMovieHarmonicCurve} or {@link AutoMovieSplineCurve}).
     */
    coefficients: number[];

    /**
     * First physical-station derivative of every coefficient, mm/mm, in the
     * same basis layout and shared by both adjacent intervals. These are not
     * slopes per normalized interval or pole coordinate.
     */
    slopes: number[];

    /**
     * Out-of-plane displacement of a spline section along the frame normal `v x
     * u` (up for a horizontal layer), one value per control point in mm,
     * interpolated over phase by the same B-spline and over station by the same
     * Hermite rule as the coefficients.
     *
     * A fitted specimen's sections lie in their planes, so its layers omit it;
     * a shape law that moves an anatomical point across its station (see
     * `AutoMovieHumanBodyLaw`) writes it. Absent means zero.
     */
    lift?: number[];

    /**
     * Station derivative of every `lift` value in mm per mm; present exactly
     * when `lift` is.
     */
    liftSlopes?: number[];

    /**
     * Second physical-station derivative of every `lift` value, 1/mm. When both
     * layers of an interval carry it, the lift takes the quintic rule as the
     * coefficients do with `curvatures`; absent, the cubic Hermite of values
     * and slopes.
     */
    liftCurvatures?: number[];

    /**
     * Second physical-station derivative of every coefficient, 1/mm. Without
     * common explicit coefficientSource data, when both layers of an interval
     * carry it, the interval is the quintic Hermite of their values, slopes and
     * these (`AutoMovieStationHermite`); absent, the cubic Hermite of values
     * and slopes.
     */
    curvatures?: number[];

    /**
     * First physical-station derivatives of the layer's plane component by
     * component: origin in mm/mm, axes in 1/mm. These derivative triples are
     * not positions or unit axes. Matching actual frameSource records own the
     * intermediate frame instead. Otherwise, when both interval layers carry
     * them, the plane is the Hermite of the two planes' components, its axes
     * not renormalised. Shared values and slopes give C1 continuity with the
     * cubic rule; consistent shared frameCurvatures select the quintic rule and
     * give C2 continuity. Without frameSlopes, the rotation Hermite of
     * `AutoMovieLoftFrame.interpolate`.
     */
    frameSlopes?: IAutoMovieLoftSectionFrame;

    /**
     * Second physical-station derivatives of the plane: origin in 1/mm and axes
     * in 1/mm². Together with both endpoints' frameSlopes, these select the
     * quintic component rule when no common actual-axis source owns the
     * interval.
     */
    frameCurvatures?: IAutoMovieLoftSectionFrame;

    /**
     * The view box and shoulders the view-to-section operator
     * (`AutoMovieViewLoft`) drew this layer from; present exactly on layers it
     * emitted from a four-quarter section (a touch/split conic chain's layer
     * has none). The section touches the box at the guide phases 0, `pi / 2`,
     * `pi` and `3 pi / 2`: the point there is the outline's value on its chart
     * axis (a knot of the section's B-spline), so an audit reads the
     * guide-touch rule on the layers that carry it.
     */
    view?: IAutoMovieLoftChain.IView;
  }

  /** The raw view-section inputs retained for a generated layer. */
  export interface IView {
    /**
     * Half extents of the box from the axis along `+u`, `+v`, `-u` and `-v`,
     * mm, positive.
     */
    extents: [number, number, number, number];

    /**
     * Each quarter's conic shoulder, quarter `q` from guide `q` to guide `q +
     * 1`; `sqrt(2) - 1` the ellipse.
     */
    shoulders: [number, number, number, number];

    /** The shared curvature of the section at each guide, 1 per mm. */
    curvatures: [number, number, number, number];
  }

  /**
   * World point and phase tangent reader prepared at one physical-mm station.
   *
   * T is the chain's correspondence phase in radians, not time or a normalized
   * turn. LoftChain delegates to LoftPoint; the returned closure retains
   * immutable chain/source data and one station's frame/lift preparation until
   * released. Each call returns fresh mutable vectors, includes relief
   * contributions and propagates native source or callback errors; nonfinite
   * requested outputs throw. No station derivative is required, including at a
   * phase-constant admitted pole.
   */
  export type IPhaseSamplerResult = (t: number) => IAutoMovieLoftPhaseReading;
}
