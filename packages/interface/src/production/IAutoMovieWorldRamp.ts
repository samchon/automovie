/** Centreline and elevation inputs for a rectangular world-plane ramp. */
export namespace IAutoMovieWorldRamp {
  /** Construct a rectangular planar ramp from a centerline, width and rise. */
  export type IInput = {
    /**
     * Nonblank surface identity; the constructor rejects whitespace-only text
     * and preserves spelling.
     */
    id: string;
    /**
     * World XZ centerline start, where the plane has baseHeight.
     */
    from: IInputFrom;
    /**
     * World XZ centerline end, where the plane has baseHeight + rise.
     * Its distance from the start must be finite and positive. The sides of
     * the rectangle must stay distinct at both endpoints.
     */
    to: IInputTo;
    /**
     * Finite positive full width in metres perpendicular to the centerline; the
     * footprint extends half this distance on each side.
     */
    width: number;
    /** Finite world Y in metres at from; may be negative. */
    baseHeight: number;
    /**
     * Finite signed height change in metres from from to to. Zero makes a flat
     * ramp, and negative values descend along the directed centerline.
     */
    rise: number;
    /**
     * Authored support permission copied unchanged; neither steepness nor
     * direction changes it automatically.
     */
    walkable: boolean;
  };

  /** The to object of {@link IInput}. */
  export type IInputTo = {
    /** Centerline end world X in metres. */
    x: number;
    /** Centerline end world Z in metres. */
    z: number;
  };

  /** The from object of {@link IInput}. */
  export type IInputFrom = {
    /** Centerline start world X in metres. */
    x: number;
    /** Centerline start world Z in metres. */
    z: number;
  };
}
