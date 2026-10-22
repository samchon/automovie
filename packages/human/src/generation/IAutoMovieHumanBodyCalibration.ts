import type { IAutoMovieHumanLoftChain } from "../lofting/AutoMovieHumanLoftChain";

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
 * Chains form a tree from `root` downward. Each {@link IEvent} sits at the
 * bottom of its parent chain, where the parent's section is the contact of
 * several child sections touching at pinch points (a crotch, an axilla, the
 * webs between fingers). The parent's bottom ring is split along arcs of its
 * own phase into the children's top rings, so the children start from the
 * parent's vertices. A chain end with no event is closed at a {@link IPole}.
 *
 * Calibration is one stage of the campaign plan: the coefficients first
 * reproduce one specimen, then are replaced by laws in the public inputs
 * identified across all references.
 */
export interface IAutoMovieHumanBodyCalibration {
  /** Achieved stature input of the calibration specimen in mm. */
  stature: number;

  /** Name of the root chain, lofted upward from its bottom event. */
  root: string;

  /** All chains of the tree. */
  chains: IAutoMovieHumanLoftChain[];

  /** Branch events, one per chain whose bottom splits. */
  events: IAutoMovieHumanBodyCalibration.IEvent[];

  /** Closing points of chain ends without an event. */
  poles: IAutoMovieHumanBodyCalibration.IPole[];
}
export namespace IAutoMovieHumanBodyCalibration {
  /** Split of a parent's bottom ring into its children's top rings. */
  export interface IEvent {
    /** Parent chain whose bottom layer is the contact section. */
    parent: string;

    /** Children and the parent-phase arcs that form their top rings. */
    splits: ISplit[];
  }

  /** One child's share of a parent's bottom ring. */
  export interface ISplit {
    /** Child chain whose top layer meets the parent's bottom layer. */
    child: string;

    /**
     * Parent-phase arcs `[from, to]` in radians, in ring order. An arc runs
     * forward in phase from `from` to `to` and wraps through 2pi when
     * `to < from`. Arc ends are pinch phases, where the parent's section
     * touches itself; consecutive children share the vertex at a pinch.
     */
    arcs: [number, number][];
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
