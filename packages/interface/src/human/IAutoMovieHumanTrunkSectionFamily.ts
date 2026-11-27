import type { IAutoMovieLoftContract } from "../construction/IAutoMovieLoftContract";
import type { IAutoMovieViewSection } from "../construction/IAutoMovieViewSection";
import type { IAutoMovieHumanTrunkViews } from "./IAutoMovieHumanTrunkViews";

/**
 * Type contracts exchanged by AutoMovieHumanTrunkSectionFamily; runtime
 * evaluation remains in Human.
 */
export namespace IAutoMovieHumanTrunkSectionFamily {
  /** One named measurement plane and its caller-owned four-support source. */
  export interface IPlane {
    /** Original anatomical site name, independent of output sampling. */
    site: string;
    /** World-Y station in calibration millimetres. */
    y: number;
    /** Section origin in world X/Z, calibration millimetres. */
    origin: [number, number];
    /**
     * Independent original posterior profile value, retained without
     * subtractive reconstruction.
     */
    back: number;
    /** The same original support box consumed by the trunk's view construction. */
    box: IAutoMovieViewSection.IBox;
    /**
     * Original independent fullness input; a changed tape requires a new
     * family.
     */
    fullness: IAutoMovieHumanTrunkViews.ISite["fullness"];
    /** Solve this unchanged box/tape once at its first original-source demand. */
    resolve(): IFullness;
    /**
     * Evaluate that original plane's conic family at the actual candidate
     * shoulder.
     */
    section(shoulder: number): IAutoMovieViewSection.ISection;
    /**
     * Admit this exact support box's native shoulder reach once, including a
     * null refusal.
     */
    range(): IAutoMovieViewSection.IRange | null;
  }

  /**
   * The actual independent scalar constraint result, including its unchanged
   * admission failures.
   */
  export interface IFullness {
    /**
     * Null preserves a failed original section rather than selecting another
     * shoulder.
     */
    fullness: {
      /**
       * Dimensionless native conic shoulder controlling section fullness; the
       * owning section builder admits its range.
       */
      shoulder: number;
    } | null;
    /** Original section-solve diagnostics, with the same source/site producer. */
    diagnostics: IAutoMovieLoftContract.IDiagnostic[];
  }
}
