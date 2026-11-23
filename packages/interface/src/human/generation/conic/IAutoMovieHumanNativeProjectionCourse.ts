import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieViewAxis } from "../../../construction/IAutoMovieViewAxis";
import type { IAutoMovieViewPart } from "../../../construction/IAutoMovieViewPart";

/**
 * Original and projected material-axis records.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Original and projected material-axis records.
 * @evidence contracts/development/design.md#principled-representation Physical lengths are millimetres, source identity is explicit, and a speed bound accompanies the projected axis.
 * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieHumanNativeProjectionCourse owns the preparation and native-scale evaluation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation retains the straight-frame premise at the actual caller.
 */
export namespace IAutoMovieHumanNativeProjectionCourse {
  /**
   * One projected material course and the sampling bounds of the same preparation.
   *
   * @evidence contracts/development/common.md#meaningful-documentation One projected material course and the sampling bounds of the same preparation.
   * @evidence contracts/development/design.md#principled-representation Material breakpoints use millimetres and the speed bound uses world millimetres per material millimetre. The projection owner validates its straight-frame premise.
   * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieHumanNativeProjectionCourse publishes the axis and its bound so downstream readers sample the same source.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The sampling bound describes the axis origin. Surface positions and their own speed are outside this record.
   */
  export interface IPrepared {
    /** Same original axis on identity, otherwise the common projected source axis. */
    axis: IAutoMovieViewAxis.IAxis;

    /** Scale times the norm of the original constant station tangent, rounded outward: world course-origin mm per material mm, not a surface-point chord bound. */
    maximumSpeed: number;

    /** Interior course joins in native material mm; a uniform scale has none. */
    materialBreaks: readonly number[];
  }

  /**
   * Original endpoint projection and a reader tied to its immutable source.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Original endpoint projection and a reader tied to its immutable source.
   * @evidence contracts/development/design.md#principled-representation The chord is in world millimetres. Read attempts count the two kinds of source query separately. The project callback admits only its original source identity.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Native breast generation reuses the original calibration while creating candidate axes.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Source identity and the known straight-frame premise stay with the producer and are checked within its documented scope.
   */
  export interface IProjectionOwner {
    /** Original rail-to-native-pole endpoint chord, world mm, measured once. */
    readonly projection: number;

    /** Original-only read attempts, separate from calipers and changed-axis queries. */
    readonly calibration: {
      /** Actual original axis.at endpoint attempts during this preparation. */
      readonly point0ReadAttempts: number;
      /** Actual original axis.jet station2 attempts during this preparation. */
      readonly axis2ReadAttempts: number;
    };

    /**
     * Project the same immutable bank source on its owned current skin axis.
     * originalSource must be the captured descriptor, not a candidate/copy.
     * The current root producer owns its provenance and known straight-frame
     * premise; finite checks do not authenticate arbitrary callbacks globally.
     *
     * @param targetD Requested rail-to-pole world chord, mm; its ratio to the original chord is the scale.
     * @param origin Material station held fixed by the scale, mm; the rail when absent.
     * @param shift World translation of the whole scaled course, mm; none when absent. A part that rides a
     *   host whose skin moves takes the host's displacement here, so scale and carriage stay one rigid-affine map.
     */
    project(
      originalSource: IAutoMovieViewPart,
      currentQualifiedAxis: IAutoMovieViewAxis.IAxis,
      targetD: number,
      origin?: number,
      shift?: AutoMovieVector3Tuple,
    ): IPrepared;
  }
}
