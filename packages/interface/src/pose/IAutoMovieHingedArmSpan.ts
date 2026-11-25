import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * Contracts of `hingedArmSpan`: a hinged chain's reach span and its fixed
 * geometry.
 */
export namespace IAutoMovieHingedArmSpan {
  /**
   * One chain's prepared segment-length gate and span coefficients. A caller
   * can share them with sources that use the same four rest records. An empty
   * record leaves those values for the source to prepare.
   */
  export interface ISpan {
    /** Segment-length admission for the fixed offsets. */
    valid?: boolean;

    /** Fixed hinge and span coefficients, or null for degenerate geometry. */
    geometry?: IGeometry | null;
  }

  /** The hinge-only span coefficients, independent of target and range. */
  export interface IGeometry {
    /** Actual normalized hinge, shared with branch posing after admission. */
    hinge: IAutoMovieVector3;

    /** Constant term of the squared root-to-effector span. */
    k: number;

    /** Cosine coefficient of that span. */
    alpha: number;

    /** Sine coefficient of that span. */
    beta: number;

    /** Magnitude of the two harmonic coefficients. */
    span: number;

    /** Phase of that sinusoid, radians. */
    phase: number;
  }
}
