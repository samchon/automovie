import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * A water environment for human buoyancy and drag queries: surface height in
 * world metres and optional density in kilograms per cubic metre. HumanWater
 * uses fresh-water density when omitted.
 */
export interface IAutoMovieMotionHumanWater {
  /** The surface's height, world metres. */
  surface: number;

  /** The density, kg/m³; fresh water when absent. */
  density?: number;

  /**
   * The blade area of a fin worn on each foot, square metres: a plate along the
   * sole that the water drags on across its face. No fins when absent.
   */
  fins?: number;
}

/** Operation-local contracts supporting IAutoMovieMotionHumanWater. */
export namespace IAutoMovieMotionHumanWater {
  /** The water's summed forces on a posed body. */
  export interface ISum {
    /** Buoyancy, world newtons. */
    buoyancy: IAutoMovieVector3;

    /** Drag, world newtons. */
    drag: IAutoMovieVector3;

    /** The submerged volume, m³. */
    submerged: number;

    /** The body's whole volume, m³. */
    volume: number;
  }
}
