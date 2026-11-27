import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * Input of `projectIrradianceProbe`: the six faces of one probe's cube
 * as the renderer drew and read them back.
 */
export namespace IAutoMovieProjectIrradianceProbe {
  /** A probe's cube. */
  export interface IProps {
    /** Texels along each face side, a positive safe integer. */
    size: number;

    /** Six faces covering every direction once, in any order. */
    faces: IFace[];
  }

  /**
   * One cube face: a 90° square view along `forward`, its texel `(i, j)`
   * (column, row from the bottom) seeing the direction `forward + s right + t
   * up` with `s = (i + 0.5) / size × 2 − 1` and `t = (j + 0.5) / size × 2 −
   * 1`.
   */
  export interface IFace {
    /** Unit world direction of the face's centre. */
    forward: IAutoMovieVector3;

    /** Unit world direction of the face's +s axis. */
    right: IAutoMovieVector3;

    /** Unit world direction of the face's +t axis. */
    up: IAutoMovieVector3;

    /**
     * Linear radiance in nits, RGBA per texel, rows from the bottom, `size²`
     * texels.
     */
    radiance: ArrayLike<number>;

    /**
     * One flag per texel in the same order, nonzero where the texel sees a back
     * face.
     */
    backFaces: ArrayLike<number>;
  }
}
