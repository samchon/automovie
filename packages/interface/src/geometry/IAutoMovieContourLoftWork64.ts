import type { AutoMovieVector3Tuple } from "./AutoMovieVector3Tuple";
import type { IAutoMoviePrepareContourDocument64Document } from "./IAutoMoviePrepareContourDocument64Document";

/** Mutable rings and retained section relationships for one contour loft. */
export namespace IAutoMovieContourLoftWork64 {
  /**
   * One sampled generating ring, identified within the invocation and ordered
   * by declared winding.
   */
  export interface Ring {
    /** Stable generated ring identity. */
    id: string;
    /** Sampled model-millimetre boundary points shared by subsequent stages. */
    points: AutoMovieVector3Tuple[];
    /** Declared signed material boundary orientation. */
    winding: number;
    /** Complete source phase period, or zero after a sampling refusal. */
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
    /** Borrowed prepared event records assigned to this incidence group. */
    critical: IAutoMoviePrepareContourDocument64Document["events"];
    /** Explicit local omission reason, when present. */
    unsupported?: string;
  }

  /** One adjacent-cut work address and its independent local groups. */
  export interface Slab {
    /** Upper retained section index. The lower section is at k - 1. */
    k: number;
    /** All declared local groups; unsupported groups are retained. */
    groups: IAutoMovieContourLoftWork64.Group[];
  }
}
