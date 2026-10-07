import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * An owned metric hair polyline, including its rooted boundary transition.
 * `freeFrom` separates skin-adjacent stem chords from clearance-certified free
 * chords. It is derived geometry metadata, never a personal authoring input.
 * The stem must reach the same free clearance before its length or budget ends;
 * a wholly skin-adjacent lock is not a supported substitute.
 *
 * @evidence contracts/common.md#principled-implementation An explicit first free station preserves the distinction between root tangent, finite curved stem and later Lipschitz-certified free chords.
 * @evidence contracts/common.md#clear-and-simple-design One polyline and one boundary index describe the geometry without a second curve or an implicit first-row exemption.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The boundary is computed from the same current skin query for every lock rather than a subject or style label.
 * @evidence contracts/common.md#meaningful-documentation States ownership, metric/frame meaning and which chords the boundary index identifies.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping It transports one numerical curve; the builder owns displayed layer identity.
 * @evidenceExclude contracts/modeling.md#parameter-channels It carries derived geometry, not a styling channel.
 * @evidence contracts/modeling.md#emitted-geometry Every station remains a source point; the mesher retains all stem stations and simplifies only the free remainder.
 * @evidence contracts/modeling.md#spatial-conventions Stations, length and clearance are current head-frame metres and normal is dimensionless.
 * @evidence contracts/modeling.md#shared-boundaries freeFrom names the first full-clearance station on the same closed skin snapshot used to certify the stem.
 * @evidenceExclude contracts/modeling.md#rendered-observation It transports numerical output; the assembled builder owns observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source It carries derived geometry rather than establishing an anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range It carries the admitted producer's result rather than a clinical range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority No member is a personal vertex or curve authoring control.
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
