import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * Contracts of `hingedArmSpan`: a hinged chain's reach span and its fixed
 * geometry.
 */
export namespace IAutoMovieHingedArmSpan {
  /**
   * A holder of one chain's segment-length gate and span coefficients, empty
   * until a branch query of a source prepared with it fills it
   * (`hingedArmSwivel.prepare`). Its owner keeps it for as long as the chain's
   * four rest records stay unchanged and passes it only to sources with those
   * same records.
   */
  export interface ISpan {
    /** Segment-length admission, before the target gate. */
    valid?: boolean;

    /**
     * Hinge and span admission, after a nondegenerate target; null when the
     * hinge cannot change the span.
     */
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
