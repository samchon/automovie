import type { IAutoMovieLoftChain } from "../construction/IAutoMovieLoftChain";
import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieHumanLegCrotchFillet } from "./IAutoMovieHumanLegCrotchFillet";

/**
 * Type contracts exchanged by AutoMovieHumanLegCrotchRoot; runtime evaluation
 * remains in Human.
 */
export namespace IAutoMovieHumanLegCrotchRoot {
  /** The crotch ring a leg takes, canonical: the trunk's arc, front pinch first. */
  export interface IRoot {
    /** The arc from the front pinch round the outside to the rear pinch. */
    arc: AutoMovieVector3Tuple[];

    /** The trunk's station derivative at each point of the arc, per mm up. */
    rates: AutoMovieVector3Tuple[];

    /**
     * The trunk's second station derivative at each point of the arc, per mm
     * squared.
     */
    seconds: AutoMovieVector3Tuple[];

    /** Station of the ring. */
    y: number;

    /** Centre the ring's phases are read about, `[x, z]`. */
    centre: [number, number];

    /**
     * The rounded ring at the leg's phases, with its normals and the trunk's
     * derivatives.
     */
    ring: IAutoMovieHumanLegCrotchFillet.ILoop;

    /** Corner size at the ring. */
    corner: number;
  }

  /** The trunk and the phase arcs of its bottom ring that one leg takes. */
  export interface IArcs {
    /** The trunk chain, owner of the ring. */
    trunk: IAutoMovieLoftChain;

    /** The arcs `[from, to]` of the trunk's phases the leg takes, radians. */
    arcs: [number, number][];
  }

  /**
   * The centre argument of AutoMovieHumanLegCrotchRoot.of. The crotch ring a
   * leg takes, with the trunk's own jet along it.
   *
   * @param calibration Calibration holding `trunk` and the event.
   * @param side The leg's side.
   * @param sign 1 for the left leg, -1 for the right's reflection.
   * @param centre Centre the ring's phases are read about, `[x, z]`: the law's
   *   own last centre.
   */
  export type OfCentre = [number, number];
}
