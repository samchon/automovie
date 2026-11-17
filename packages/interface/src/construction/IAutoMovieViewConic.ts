import type { IAutoMovieConicArc } from "./IAutoMovieConicArc";
import type { IAutoMovieConicHermite } from "./IAutoMovieConicHermite";

/** Data and callback contracts shared by the ViewConic operations. */
export namespace IAutoMovieViewConic {
  /**
     * Selected quarter location, preserving the source's actual numeric clock.
     *
     * @evidence contracts/development/design.md#principled-representation Extends the shared numeric ray with the exact quarter and raw/G2 selection.
     * @evidence contracts/development/design.md#minimal-and-owned-surface One descriptor is consumed by fixed-clock field readers.
     * @evidence contracts/development/design.md#prohibited-design-shortcuts No second inverse, implicit fallback or invented endpoint clock is hidden.
     * @evidence contracts/development/common.md#meaningful-documentation Angle is original-quarter local; distance is selected-end local; point and tangent are already restored to the original chart.
     */
    export interface IRay extends IAutoMovieConicArc.IRay {
      /** Original quarter index in[0,3]. */
      quarter: number;
  
      /** Actual selected source piece. */
      kind: "conic" | "start" | "end";
  
      /** Original quarter-local polar angle, radians. */
      angle: number;
  
      /** Small angular distance in the selected end chart, radians. */
      distance: number;
    }

  /**
     * One source quarter and its disjoint initial/final C2 supports.
     *
     * @evidence contracts/development/design.md#principled-representation The positive extents/shoulder identify the original conic; each optional end holds its distinct convex G2 approximation and native boundary.
     * @evidence contracts/development/design.md#minimal-and-owned-surface Two extents, one shoulder, two optional ends and one native partition expose the complete prepared quarter.
     * @evidence contracts/development/design.md#prohibited-design-shortcuts Holds no sampled replacement curve or emitted mesh data.
     * @evidence contracts/development/common.md#meaningful-documentation Members state length, shoulder, optional-end and native-partition meanings.
     */
    export interface IQuarter<T = number> {
      /** First and second positive half extents, millimetres. */
      extents: readonly [T, T];
  
      /** Original conic shoulder in (0,1). */
      shoulder: T;
  
      /** Optional initial convex G2 end; null preserves the exact quadratic. */
      start: IAutoMovieConicHermite.IPatch<T> | null;
  
      /** Optional reflected final convex G2 end, with the same ownership. */
      end: IAutoMovieConicHermite.IPatch<T> | null;
  
      /** Original quadratic native-turn partition in create; empty in geometry-only prepareGeometry. */
      parameters: readonly number[];
  
      /** Shared radial second derivatives at the two zero-slope main guides, millimetres. */
      guides: readonly [T, T];
  
      /** Shared geometric guide curvatures; auxiliary branch jets at a tie are not derivatives of min. */
      curvatures: readonly [T, T];
    }

  /**
     * Prepared closed source with an explicit admission failure state.
     *
     * @evidence contracts/development/design.md#principled-representation Keeps four admitted quarter functions or the exact reason their positive-curvature/finite arithmetic premise failed.
     * @evidence contracts/development/design.md#minimal-and-owned-surface One discriminating nullable failure keeps source admission separate from radius reads.
     * @evidence contracts/development/design.md#prohibited-design-shortcuts A failure does not select a fallback shape, hidden quarter or sampled polygon.
     * @evidence contracts/development/common.md#meaningful-documentation States successful quarter count and failure meaning.
     */
    export interface ICurve<T = number> {
      /** Four source quarters on success; empty on admission failure. */
      quarters: readonly IAutoMovieViewConic.IQuarter<T>[];
  
      /** Original admission rule and numbers, or null. */
      failure: string | null;
    }
}
