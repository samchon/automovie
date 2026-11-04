import type { AutoMovieHumanLoftContract } from "../lofting/AutoMovieHumanLoftContract";
import type { IAutoMovieHumanLoftAperture } from "../lofting/IAutoMovieHumanLoftAperture";
import type { IAutoMovieHumanLoftChain } from "../lofting/IAutoMovieHumanLoftChain";
import type { AutoMovieHumanMouth } from "./AutoMovieHumanMouth";
import type { AutoMovieHumanSkeletonLaw } from "./AutoMovieHumanSkeletonLaw";
import type { IAutoMovieHumanTrunkLandmarks } from "./IAutoMovieHumanTrunkLandmarks";

/**
 * Shared shape coefficients (theta) of the generated body surface.
 *
 * The chains are principal layers fitted from saved Recovery/Hermite
 * sections of a calibration specimen in the registered frame: forward +X,
 * up +Y, lateral +Z, millimetres, floor at y = 0. The generator reads this
 * object and the public parameters only; it never reads reference files.
 *
 * ## Chain tree
 *
 * Chains are joined by {@link IEvent}s. At an event the parent's end section
 * is the contact of several child sections touching at pinch points: a
 * `down` event sits at the parent's bottom with its children below (a
 * crotch, an axilla, the webs between fingers), an `up` event at the
 * parent's top with its children above (an ear rim leaving the head). The
 * parent generates the contact ring once; each child's adjacent end is the
 * arcs of that ring along the parent's phases, so the chains share those
 * vertices. A chain end with no event closes at an {@link IPole}.
 *
 * Calibration is one stage of the campaign plan: the coefficients first
 * reproduce one specimen, then are replaced by laws in the public inputs
 * identified across all references.
 */
export interface IAutoMovieHumanBodyCalibration {
  /** Achieved stature input of the calibration specimen in mm. */
  stature: number;

  /** All chains of the tree. */
  chains: IAutoMovieHumanLoftChain[];

  /** Branch events, at most one per chain end. */
  events: IAutoMovieHumanBodyCalibration.IEvent[];

  /** Closing points of chain ends without an event. */
  poles: IAutoMovieHumanBodyCalibration.IPole[];

  /** Anatomical openings cut from the skin by world position, e.g. the eyelid apertures. */
  apertures: IAutoMovieHumanLoftAperture[];

  /** Eyeball globes seated behind the eyelid apertures. */
  eyes: IAutoMovieHumanBodyCalibration.IEye[];

  /**
   * Contracts the body law's pieces broke while building this calibration,
   * each piece degraded to its base (`construction-levels.md`, Totality and
   * diagnostics). The body law creates the list once and every stage that
   * spreads the calibration shares it, so a piece records into it where it
   * degrades; `AutoMovieHuman.generate` carries it into the shape's own
   * diagnostics. A calibration built by hand, as a part viewer's or a test's,
   * may leave it out.
   */
  diagnostics?: AutoMovieHumanLoftContract.IDiagnostic[];

  /**
   * Chains rooted in a closed loop on another chain's surface (an auricle on
   * the head, a limb on the trunk) instead of sharing a contact ring. Absent
   * means none.
   */
  appendages?: IAutoMovieHumanBodyCalibration.IAppendage[];

  /**
   * The bind skeleton the limbs were lofted on, placed before any limb skin
   * by `AutoMovieHumanSkeletonLaw`. Absent on a calibration still being built.
   */
  skeleton?: AutoMovieHumanSkeletonLaw.IBone[];

  /**
   * The mouth behind the `mouth` aperture: the lips' contact line, the teeth,
   * the cavity's lining and the tongue, placed by `AutoMovieHumanMouth`.
   * Absent on a calibration whose head has no generated mouth.
   */
  mouth?: AutoMovieHumanMouth.IMouth;

  /**
   * The head's landmarks as its construction solved them, so parts placed on
   * the head (hair, garments) attach through landmarks instead of
   * coordinates. Absent on a calibration whose head is not generated.
   */
  head?: IAutoMovieHumanBodyCalibration.IHeadLandmarks;

  /**
   * The trunk's landmarks as its solve placed them, left side: the shoulders'
   * arm arc stands on their glenohumeral centre, so the arm and the skeleton
   * stand on the same centre instead of reading one off the skin. Absent on a
   * calibration whose trunk is not generated.
   */
  trunk?: IAutoMovieHumanTrunkLandmarks;

  /**
   * The nail plates, one per digit chain: a window of the digit chain's own
   * surface from the plate's root to its free edge, as wide as the plate
   * (`AutoMovieHumanNailPlate`). The skin's nail parts are that window of the
   * chain lifted by the plate's thickness. Absent on a calibration without
   * digits.
   */
  nails?: IAutoMovieHumanBodyCalibration.INail[];
}
export namespace IAutoMovieHumanBodyCalibration {
  /** A nail plate's window on its digit chain. */
  export interface INail {
    /** Digit chain the plate lies on, e.g. `finger.left.index`. */
    chain: string;

    /** Chain station of the plate's root (the cuticle), mm. */
    root: number;

    /** Chain station of the plate's free edge, mm. */
    edge: number;

    /** Width of the plate edge to edge, mm. */
    width: number;

    /** Unit dorsal direction at the root: the side of the chain the plate lies on. */
    dorsal: [number, number, number];
  }

  /** Head landmarks on the skin, `[x, y, z]` calibration millimetres. */
  export interface IHeadLandmarks {
    /** Vertex, the crown's highest point on the midline. */
    vertex: [number, number, number];

    /** Glabella, the forehead's most prominent midline point. */
    glabella: [number, number, number];

    /** Soft-tissue nasion. */
    nasion: [number, number, number];

    /** Exocanthion of each eye, the right one the left's reflection. */
    exocanthion: Record<"left" | "right", [number, number, number]>;

    /** Ear roots, otobasion superius and inferius, each side. */
    otobasion: Record<
      "left" | "right",
      { superius: [number, number, number]; inferius: [number, number, number] }
    >;
  }

  /**
   * One appendage: a chain whose end meets a closed root loop on its base
   * chain through a transition strip.
   *
   * The base is not lofted inside the loop. Between the loop on the base and
   * the appendage's end ring, a strip `T(t, w)` runs from the appendage
   * (w = 0) to the base (w = 1) as the quintic Hermite of the two curves,
   * their cross derivatives and their second cross derivatives, so the
   * skin is continuous in position, tangent plane and curvature across both
   * edges (G2). Ring phase t of the appendage's end and loop parameter t
   * name the same strip column.
   */
  export interface IAppendage {
    /** Appendage chain. */
    chain: string;

    /** End of the appendage chain that meets the root loop. */
    end: "bottom" | "top";

    /** Base chain the loop lies on. */
    base: string;

    /**
     * Root loop in the base's chart as a periodic cubic B-spline of M
     * control points `[s_0 .. s_{M-1}, t_0 .. t_{M-1}]`: station in mm and
     * phase in radians, the phases continuous (unwrapped) round the loop.
     * Either turning sense is accepted. With a winding, the phase is the
     * winding times the loop parameter plus this remainder.
     */
    root: number[];

    /**
     * Turn of the root loop's phase round the base's cap pole, for a loop
     * that winds once round it (a digit's or toe's on the palm's or the
     * sole's cap): the base is left out beyond the loop toward the pole.
     * Absent means none: the loop encloses its region of the chart.
     */
    winding?: 1 | -1;

    /**
     * Cross-derivative length of the strip at both edges as a share of the
     * chord between them: 1 lays the strip like a straight blend, more
     * makes it fuller.
     */
    reach: number;

    /**
     * Interior rows of the strip, from the appendage toward the base: each
     * the offsets of one row from the edges' quintic blend at its Greville
     * abscissa, in the blend's frame there (along the ring, the normal and
     * their cross product), as three periodic cubic B-splines in the ring
     * phase of M control points, `[a_0 .. a_{M-1}, b_0 .., c_0 ..]` in mm
     * (`AutoMovieHumanBodyStrip`). Absent means none: the strip is then the
     * six edge rows alone.
     */
    rows?: number[][];
  }

  /**
   * One eyeball globe, fitted as a sphere to the reference eyeball surface.
   * The generator scales it with the body and hands it to the appearance
   * layer, which builds the eyeball there.
   */
  export interface IEye {
    /** Anatomical side: left is +Z. */
    side: "left" | "right";

    /** Globe centre in mm. */
    centre: [number, number, number];

    /** Globe radius in mm. */
    radius: number;
  }

  /** Split of a parent's end ring into its children's adjacent end rings. */
  export interface IEvent {
    /** Parent chain whose end layer is the contact section. */
    parent: string;

    /**
     * `down`: the contact is the parent's bottom layer and the children lie
     * below it; `up`: the contact is the parent's top layer and the
     * children lie above it.
     */
    direction: "down" | "up";

    /** Children and the parent-phase arcs that form their adjacent end rings. */
    splits: ISplit[];

    /**
     * Length over which a child turns onto the parent's tangent plane, in
     * radii of its end ring. Absent, the child turns within its last interval.
     */
    fillet?: number;

    /**
     * The children already leave the contact in the parent's tangent plane, by
     * their own construction, so the join leaves them as built. Absent, the join
     * moves each child's end ring onto the parent's and re-slopes it.
     */
    shared?: true;

    /**
     * Whether the children start apart from the parent's ring, joined to it by
     * the webs' own surface (`AutoMovieHumanBodyWeb`): each child's adjacent end
     * is its own section past the webs' crests, and the skin from the parent's
     * ring to those sections, the saddle of every web included, is built by the
     * surface. Absent, the children's ends are the arcs themselves, closed across
     * each span by a chord.
     */
    web?: boolean;
  }

  /** One child's share of a parent's contact ring. */
  export interface ISplit {
    /** Child chain whose adjacent end layer meets the parent's contact layer. */
    child: string;

    /**
     * Parent-phase arcs `[from, to]` in radians, in ring order. An arc runs
     * forward in phase from `from` to `to` and wraps through 2pi when
     * `to < from`; `[0, 2pi]` is the whole ring, a continuation event where
     * a chain changes its correspondence rule. Other arc ends are pinch
     * phases, where the parent's section touches itself; consecutive
     * children share the vertex at a pinch.
     */
    arcs: [number, number][];

    /**
     * This child already leaves the contact by its own construction with the
     * parent's jet across it, as a limb's root strip does, so the join leaves it
     * as built while it still settles the event's other children. Absent, the
     * event's own `shared` decides.
     */
    shared?: true;
  }

  /** Surface pole closing a chain end. */
  export interface IPole {
    /** Chain whose end the pole closes. */
    chain: string;

    /** Which end of the chain. */
    end: "top" | "bottom";

    /**
     * Pole point `[x, y, z]` in mm: the recovered critical point (crown,
     * fingertip) when one exists, otherwise the chain's axis point at that
     * end for a provisional closure.
     */
    point: [number, number, number];

    /** Whether the pole is a recovered critical point rather than a provisional closure. */
    critical: boolean;
  }
}
