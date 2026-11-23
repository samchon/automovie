/** A short two-step transfer between named level prop surfaces. */
export interface IAutoMovieMotionHumanSupportTransfer {
  /** The unarticulated surface the entry stance already rests on. */
  from: IAutoMovieMotionHumanSupportTransfer.ISurface;

  /** The unarticulated deck surface that bears both soles after the crossing. */
  to: IAutoMovieMotionHumanSupportTransfer.ISurface;

  /**
   * Defaults to stationary docking through trailing touchdown. Set co-moving
   * for scenic gangways sharing an upright rigid motion during that interval.
   * The planner samples the relative deck frame and all four deck corners on
   * the film clock, allowing 1 mm of drift and 0.1 degrees of relative turn.
   */
  docking?: "stationary" | "co-moving";

  /**
   * The center of the final stance, in metres from the deck surface's XZ
   * origin. Defaults to that origin.
   */
  landing?: {
    /** Metres along the surface's +X axis. */
    x: number;
    /** Metres along the surface's +Z axis. */
    z: number;
  };

  /** Which foot steps first. */
  lead: "left" | "right";

  /** Planned interval, film seconds from 1.2 to 3, inclusive. */
  seconds: number;
}

/** The canonical named surface selectors for the transfer. */
export namespace IAutoMovieMotionHumanSupportTransfer {
  /**
   * A rigid rectangular prop affordance of kind "surface", with width and
   * depth.
   */
  export interface ISurface {
    /** Scene subject id of the prop carrying the surface. */
    prop: string;

    /** Id of its rectangular surface affordance. */
    surface: string;
  }
}
