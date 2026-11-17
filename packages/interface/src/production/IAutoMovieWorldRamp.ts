/**
 * Centreline and elevation inputs for a rectangular world-plane ramp.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Centreline and elevation inputs for a rectangular world-plane ramp. Endpoints and width use world XZ metres, baseHeight/rise world Y metres. worldRamp rejects nonpositive width, nonfinite height/rise and nonfinite or nonpositive squared endpoint separation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Signed rise permits descent and zero permits a flat surface. walkable is authored permission rather than an inferred slope verdict, and finite inputs do not guarantee finite derived arithmetic.
 * @evidence contracts/development/design.md#principled-representation Endpoints and width use world XZ metres, baseHeight/rise world Y metres. worldRamp rejects nonpositive width, nonfinite height/rise and nonfinite or nonpositive squared endpoint separation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface worldRamp constructs the existing IAutoMovieWorldSurface plane representation and four fresh footprint points; no separate ramp runtime is introduced.
 */
export namespace IAutoMovieWorldRamp {
  /**
   * Construct a rectangular planar ramp from a centerline, width and rise.
   *
   * @evidence contracts/development/design.md#principled-representation Endpoints and width use world XZ metres, baseHeight/rise world Y metres. worldRamp rejects nonpositive width, nonfinite height/rise and nonfinite or nonpositive squared endpoint separation.
   * @evidence contracts/development/design.md#minimal-and-owned-surface worldRamp constructs the existing IAutoMovieWorldSurface plane representation and four fresh footprint points; no separate ramp runtime is introduced.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Signed rise permits descent and zero permits a flat surface. walkable is authored permission rather than an inferred slope verdict, and finite inputs do not guarantee finite derived arithmetic.
   * @evidence contracts/development/common.md#meaningful-documentation Centreline and elevation inputs for a rectangular world-plane ramp. Endpoints and width use world XZ metres, baseHeight/rise world Y metres. worldRamp rejects nonpositive width, nonfinite height/rise and nonfinite or nonpositive squared endpoint separation.
   */
  export type IInput = {
    /** Nonblank surface identity; the constructor rejects whitespace-only text and preserves spelling. */
    id: string;
    /** World XZ centerline start, where the plane has baseHeight. Endpoints must produce finite positive squared separation. */
    from: {
      /** Centerline start world X in metres. */
      x: number;
      /** Centerline start world Z in metres. */
      z: number;
    };
    /** World XZ centerline end, where the plane has baseHeight + rise. Distinctness is checked through squared separation, including its underflow/overflow limits. */
    to: {
      /** Centerline end world X in metres. */
      x: number;
      /** Centerline end world Z in metres. */
      z: number;
    };
    /** Finite positive full width in metres perpendicular to the centerline; the footprint extends half this distance on each side. */
    width: number;
    /** Finite world Y in metres at from; may be negative. */
    baseHeight: number;
    /** Finite signed height change in metres from from to to. Zero makes a flat ramp, and negative values descend along the directed centerline. */
    rise: number;
    /** Authored support permission copied unchanged; neither steepness nor direction changes it automatically. */
    walkable: boolean;
  };
}
