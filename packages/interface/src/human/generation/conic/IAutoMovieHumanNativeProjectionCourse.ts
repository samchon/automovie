import type { IAutoMovieViewAxis } from "../../../construction/IAutoMovieViewAxis";
import type { IAutoMovieViewPart } from "../../../construction/IAutoMovieViewPart";
import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";

/** Original and projected material-axis records. */
export namespace IAutoMovieHumanNativeProjectionCourse {
  /**
   * One projected material course and the sampling bounds of the same
   * preparation.
   */
  export interface IPrepared {
    /**
     * Same original axis on identity, otherwise the common projected source
     * axis.
     */
    axis: IAutoMovieViewAxis.IAxis;

    /**
     * Scale times the norm of the original constant station tangent, rounded
     * outward: world course-origin mm per material mm, not a surface-point
     * chord bound.
     */
    maximumSpeed: number;

    /** Interior course joins in native material mm; a uniform scale has none. */
    materialBreaks: readonly number[];
  }

  /** Original endpoint projection and a reader tied to its immutable source. */
  export interface IProjectionOwner {
    /** Original rail-to-native-pole endpoint chord, world mm, measured once. */
    readonly projection: number;

    /**
     * Original-only read attempts, separate from calipers and changed-axis
     * queries.
     */
    readonly calibration: {
      /** Actual original axis.at endpoint attempts during this preparation. */
      readonly point0ReadAttempts: number;
      /** Actual original axis.jet station2 attempts during this preparation. */
      readonly axis2ReadAttempts: number;
    };

    /**
     * Project the same immutable bank source on its owned current skin axis.
     * originalSource must be the captured descriptor, not a candidate/copy. The
     * current root producer owns its provenance and known straight-frame
     * premise; finite checks do not authenticate arbitrary callbacks globally.
     *
     * @param targetD Requested rail-to-pole world chord, mm; its ratio to the
     *   original chord is the scale.
     * @param origin Material station held fixed by the scale, mm; the rail when
     *   absent.
     * @param shift World translation of the whole scaled course, mm; none when
     *   absent. A part that rides a host whose skin moves takes the host's
     *   displacement here, so scale and carriage stay one rigid-affine map.
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
