import type { AutoMovieVector3Tuple } from "../AutoMovieVector3Tuple";
import type { IAutoMoviePrepareContourDocument64Document } from "./IAutoMoviePrepareContourDocument64Document";

/** Data and callback contracts shared by the ContourLoftWork64 operations. */
export namespace IAutoMovieContourLoftWork64 {
  /**
   * One generated ring with explicit signed winding and inherited physical
   * phase.
   */
  export interface Ring {
    /** Stable generated ring identity. */
    id: string;
    /**
     * Generated physical millimetre boundary points, not original source mesh
     * vertices.
     */
    points: AutoMovieVector3Tuple[];
    /** Declared signed material boundary orientation. */
    winding: number;
    /** Complete saved generating phase period. */
    period: number;
    /** Local inability to represent this generating boundary, when present. */
    unsupported?: string;
  }

  /** Local incidence between two adjacent saved cuts. */
  export interface Group {
    /** Lower-section local ring ordinals. */
    a: number[];
    /** Upper-section local ring ordinals. */
    b: number[];
    /** Admitted generating event records owned by the prepared document. */
    critical: IAutoMoviePrepareContourDocument64Document["events"];
    /** Explicit local omission reason, when present. */
    unsupported?: string;
  }

  /** One adjacent-cut work address and its independent local groups. */
  export interface Slab {
    /** Lower saved-section ordinal. */
    k: number;
    /** All declared local groups; unsupported groups are retained. */
    groups: IAutoMovieContourLoftWork64.Group[];
  }
}
