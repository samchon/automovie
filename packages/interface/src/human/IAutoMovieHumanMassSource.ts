import type { IAutoMovieConstructionView } from "../construction/IAutoMovieConstructionView";
import type { IAutoMovieViewPart } from "../construction/IAutoMovieViewPart";
import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieHumanGlutealParent } from "./IAutoMovieHumanGlutealParent";

/**
 * Type contracts exchanged by AutoMovieHumanMassSource; runtime evaluation
 * remains in Human.
 */
export namespace IAutoMovieHumanMassSource {
  /** Actual parent-derived placement, not a central curvature estimate. */
  export interface IConnection {
    /** Identical whole-parent fields consumed by the actual parent lofts. */
    parent: IAutoMovieHumanGlutealParent.IParent;
    /** Original wall at the unchanged public apex Y/Z, mm. */
    wall: AutoMovieVector3Tuple;
    /** Anatomical AP outward unit axis. */
    normal: AutoMovieVector3Tuple;
    /** Public apex's positive distance from the actual wall, mm. */
    amplitude: number;
    /** Shared-parent-supported internal root origin, mm. */
    root: AutoMovieVector3Tuple;
    /** Root-to-wall distance along the outward axis, mm. */
    embed: number;
    /**
     * Parent-derived common AP interval for the same footprint, after bounded
     * numerical phase refinement; not an interval certificate.
     */
    rootInterval?: readonly [number, number];
    /**
     * Exact source before any internal extension, retained for source ownership
     * and comparison.
     */
    original?: IConnectionOriginal;
    /**
     * Whether the original supported root was kept or only a new inward prefix
     * was authored.
     */
    transfer?: "original-root" | "inner-prefix";
    /**
     * Same whole-parent reader that determined the root, with its explicit
     * absence.
     */
    contact(phi: number): IContact | string;
  }

  /** The original object of {@link IConnection}. */
  export type IConnectionOriginal = {
    /**
     * Geometric part with its original axis and section laws; its declared
     * source frame and units apply.
     */
    part: IAutoMovieViewPart;
    /**
     * The same part expressed as the canonical construction view, with
     * physical lengths in metres.
     */
    view: IAutoMovieConstructionView;
  };

  /** Actual root-curve point and the same parent chord that supports it. */
  export interface IContact {
    /** World point in calibration mm. */
    point: AutoMovieVector3Tuple;
    /** Whole-parent boundary owners, physical stations and phases. */
    chord: IAutoMovieHumanGlutealParent.IChord;
  }

  /**
   * Actual original-parent exit on the declared lower source guide; the final
   * kept atlas still validates this owner.
   */
  export interface ISeed {
    /** Boundary source name consumed by the join's hostFace. */
    owner: string;
    /** Actual mass chart [physical station mm, phase radians]. */
    part: [number, number];
    /** Actual original-parent chart [physical station mm, phase radians]. */
    host: [number, number];
    /** Original world point, calibration mm. */
    point: AutoMovieVector3Tuple;
  }
}
