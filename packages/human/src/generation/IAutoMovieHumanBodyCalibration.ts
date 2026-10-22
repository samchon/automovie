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
}
export namespace IAutoMovieHumanBodyCalibration {
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
