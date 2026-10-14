import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * An owned metric hair polyline, including its rooted boundary transition. `freeFrom` separates skin-adjacent stem chords from clearance-certified free chords. It is derived geometry metadata, never a personal authoring input. The stem must reach the same free clearance before its length or budget ends; a wholly skin-adjacent lock is not a supported substitute.
 *
 * @evidence contracts/common.md#principled-implementation The polyline and first full-clearance index distinguish the attached transition from free chords while total length includes both in the same metre frame.
 * @evidence contracts/common.md#clear-and-simple-design One derived curve record carries actual stations, metric length, clearance and root normal for mesh construction without exposing vertex authoring.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A wholly skin-adjacent lock is explicitly unsupported; the schema does not label an unfreed stem as a valid free path.
 * @evidence contracts/common.md#meaningful-documentation The comment fixes head-frame metres, freeFrom index bounds, chord ownership and the difference between derived metadata and personal input.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The emitted points array represents an already completed walk; integration and chord validation costs are not algorithms selected by this output type.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The curve has no request-coordination key; guide reuse and interpolation belong to the hair builder that produces it.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Point count controls retained polyline bytes and the curve's consumer owns its lifetime; no external handle or task is held.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceHairCurve {
  /** Root followed by stem and free stations, in current head-frame metres. */
  points: IAutoMovieVector3[];

  /** Whole-curve metric in metres, including the stem: the walk reports its completed target and accepted hierarchy placement reports its measured sum, subject to the existing floating-point allowance. */
  length: number;

  /** Free-station threshold in metres, including half the sampling step, requested gap, any shaft radius and the remaining rounding allowance; the chord-wide requested gap is smaller than this threshold. */
  clearance: number;

  /** Current skin host's outward unit shading normal at the seated root, with the host's triangle-plane fallback for singular or inward interpolation. */
  normal: IAutoMovieVector3;

  /**
   * Index of the first full-clearance station, in [1, points.length-1]. Chords ending at or before this index are the rooted boundary transition; chords starting at or after it retain the free-path clearance proof.
   */
  freeFrom: number;
}
