import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * An owned metric hair polyline, including its rooted boundary transition.
 * `freeFrom` separates skin-adjacent stem chords from clearance-certified free
 * chords. It is derived geometry metadata, never a personal authoring input.
 * The stem must reach the same free clearance before its length or budget ends;
 * a wholly skin-adjacent lock is not a supported substitute.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceHairCurve {
  /** Root followed by stem and free stations, in current head-frame metres. */
  points: IAutoMovieVector3[];

  /** Total measured polyline length, including its stem, in metres. */
  length: number;

  /** Fibre-path clearance of free stations, including the existing allowance. */
  clearance: number;

  /** Original current scalp triangle's outward unit normal at the root. */
  normal: IAutoMovieVector3;

  /**
   * Index of the first full-clearance station, in [1, points.length-1]. Chords
   * ending at or before this index are the rooted boundary transition; chords
   * starting at or after it retain the free-path clearance proof.
   */
  freeFrom: number;
}
