/**
 * A short two-step transfer between named level prop surfaces.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names both load-bearing surfaces, the deck-local landing station, the first foot and the film interval.
 * @evidence contracts/development/design.md#principled-representation Each endpoint pairs a prop subject with a model-local surface id. The deck station is in that surface's XZ plane.
 * @evidence contracts/development/design.md#minimal-and-owned-surface supportTransfer consumes the endpoints, docking mode, landing station, order and duration.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Uses existing surface affordances and keeps docking, reach and foot placement admission in the transfer planner.
 */
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

  /** The center of the final stance, in metres from the deck surface's XZ origin. Defaults to that origin. */
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

/**
 * The canonical named surface selectors for the transfer.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the prop instance and its named affordance.
 * @evidence contracts/development/design.md#principled-representation The two ids refer to the existing prop-scoped rectangular surface affordance.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Holds the pair used for both ends of supportTransfer.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Geometry comes from the resolved prop affordance.
 */
export namespace IAutoMovieMotionHumanSupportTransfer {
  /**
   * A rigid rectangular prop affordance of kind "surface", with width and depth.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Identifies a declared surface and its owning prop.
   * @evidence contracts/development/design.md#principled-representation One prop id scopes one affordance id.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The two ids suffice to resolve the support frame and footprint.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Uses the existing prop and affordance ids.
   */
  export interface ISurface {
    /** Scene subject id of the prop carrying the surface. */
    prop: string;

    /** Id of its rectangular surface affordance. */
    surface: string;
  }
}
