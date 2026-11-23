import type { IAutoMovieLoftSectionFrame } from "../../../construction/IAutoMovieLoftSectionFrame";
import type { IAutoMovieLoftSectionSource } from "../../../construction/IAutoMovieLoftSectionSource";
import type { IAutoMovieLoftViewSource } from "../../../construction/IAutoMovieLoftViewSource";
import type { IAutoMovieViewPart } from "../../../construction/IAutoMovieViewPart";

/**
 * Native neck boundary fields and physical-station frame derivatives before
 * coefficient construction. Runtime construction and admission remain with
 * AutoMovieHumanTrunkConnection in Human.
 */
export namespace IAutoMovieHumanTrunkConnection {
  /**
   * One actual native generating boundary and frame2; this original view
   * declares no additional phase lift.
   */
  export interface IDefinition {
    /** Actual regular neck boundary, before any coefficient layer exists. */
    boundary: IBoundary;

    /** Whole phase family, not just four supports or fitted coefficients. */
    field: Extract<
      IAutoMovieLoftSectionSource.IEndpoint["field"],
      {
        /** Discriminant selecting the native representation. */
        kind: "native";
      }
    >;
  }

  /**
   * Actual original section plane and its available physical-station
   * derivatives; no coefficient layer is manufactured.
   */
  export interface IBoundary {
    /** Physical world-height station, calibration millimetres. */
    y: number;

    /** Original world origin and fixed +X/+Z basis. */
    frame: IAutoMovieLoftSectionFrame;

    /** Actual first derivative in physical station millimetres. */
    frameSlopes: IAutoMovieLoftSectionFrame;

    /** Actual second derivative in the same physical station. */
    frameCurvatures: IAutoMovieLoftSectionFrame;
  }

  /**
   * A boundary read from an actual interval part additionally retains that
   * part's original declarations.
   */
  export interface IConnection extends IDefinition {
    /** Actual preloft source ownership retained by both original consumers. */
    original: {
      /**
       * Geometric part with its original axis and section laws; its declared
       * source frame and units apply.
       */
      part: IAutoMovieViewPart;
      /**
       * Admitted original scalar/section owner for this geometric part;
       * consumers read its declared source parameter.
       */
      source: IAutoMovieLoftViewSource.ISource;
    };
  }
}
