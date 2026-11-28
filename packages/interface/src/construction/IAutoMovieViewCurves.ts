import type { IAutoMovieLoftContract } from "./IAutoMovieLoftContract";
import type { IAutoMovieLoftSectionFrame } from "./IAutoMovieLoftSectionFrame";
import type { IAutoMovieViewOutline } from "./IAutoMovieViewOutline";

/** Data and callback contracts shared by the ViewCurves operations. */
export namespace IAutoMovieViewCurves {
  /**
   * Original signed outline of one front or side edge, with its placement
   * direction. A failed preparation retains the edge identity and a null
   * outline. The result's diagnostics explain the source refusal.
   */
  export interface ICurve {
    /** Stable source edge name formed from front or side plus its declared sign. */
    name:
      | "front.positive"
      | "front.negative"
      | "side.positive"
      | "side.negative";

    /** Chart coordinate carried by the source edge, u for front and v for side. */
    direction: "u" | "v";

    /** Prepared scalar outline, or null when its source admission failed. */
    outline: IAutoMovieViewOutline.IOutline | null;
  }

  /**
   * Four named original edges and their preparation diagnostics. A failed edge
   * retains its original slot so the caller can inspect the other sources
   * independently.
   */
  export interface IResult {
    /**
     * Edge records in front positive, front negative, side positive and side
     * negative order.
     */
    curves: IAutoMovieViewCurves.ICurve[];

    /**
     * Failures from preparing the original outlines, with the matching edge
     * name in the detail.
     */
    diagnostics: IAutoMovieLoftContract.IDiagnostic[];
  }

  /**
   * One original scalar reading, actual source frame and world point at the
   * requested station. The scalar jet concerns the source outline; frame
   * placement maps its value to the displayed world point.
   */
  export interface IReading {
    /**
     * Outline value and its available derivative representations at the
     * requested station.
     */
    scalar: IAutoMovieViewOutline.IReading;

    /** Actual axis frame used for the query, with origin in world millimetres. */
    frame: IAutoMovieLoftSectionFrame;

    /** World [x, y, z] point in millimetres using the edge's signed coordinate. */
    point: [number, number, number];
  }
}
