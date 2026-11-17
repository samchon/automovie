import type { IAutoMoviePolarSector } from "./IAutoMoviePolarSector";

/** Data and callback contracts shared by the ConicArc operations. */
export namespace IAutoMovieConicArc {
  /**
     * One numeric ray location shared with source derivative readers.
     *
     * @evidence contracts/development/design.md#principled-representation One selected native/projective clock and its geometric reading identify the actual source point.
     * @evidence contracts/development/design.md#minimal-and-owned-surface Quadratic and G2 adapters share one location record.
     * @evidence contracts/development/design.md#prohibited-design-shortcuts A descriptor does not claim source derivatives or retain a source callback.
     * @evidence contracts/development/common.md#meaningful-documentation Point and tangent use the original quarter chart; radial derivatives increase polar angle; reverse identifies the chosen end chart.
     */
    export interface IRay {
      /** Physical point in the original quarter chart. */
      point: readonly [number, number];
  
      /** Unit tangent in increasing original polar direction. */
      tangent: readonly [number, number];
  
      /** Actual radial phase jet. */
      radial: IAutoMoviePolarSector.Jet;
  
      /** Logarithm of positive geometric curvature. */
      logCurvature: number;
  
      /** Selected first-half quadratic parameter, or null for a cubic. */
      native: number | null;
  
      /** Selected cubic log odds, or null at an endpoint or quadratic. */
      clock: number | null;
  
      /** Explicit endpoint identity; a null clock never implies an interior parameter. */
      position: "first" | "interior" | "last";
  
      /** Selected chart was reflected from the original quarter. */
      reverse: boolean;
    }
}
