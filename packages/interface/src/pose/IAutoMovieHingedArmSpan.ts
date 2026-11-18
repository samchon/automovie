import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * Contracts of `hingedArmSpan`: a hinged chain's reach span and its fixed geometry.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each member states its unit and the fixed chain it describes.
 * @evidence contracts/development/design.md#principled-representation The span a hinged chain reaches and the geometry it is read from.
 * @evidence contracts/development/design.md#minimal-and-owned-surface `hingedArmSpan` produces them for the prepared chain rig constants.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Fixed geometry only; no target answer is retained.
 */
export namespace IAutoMovieHingedArmSpan {
  /**
   * A holder of one chain's segment-length gate and span coefficients, empty
   * until a branch query of a source prepared with it fills it
   * (`hingedArmSwivel.prepare`). Its owner keeps it for as long as the
   * chain's four rest records stay unchanged and passes it only to sources
   * with those same records.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the holder keeps, who fills it, the owner's premise and its lifetime.
   * @evidence contracts/development/design.md#principled-representation Two lazily filled members, each absent until its admission site is first reached, so a holder never claims a reading no query made.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members, written by `hingedArmSwivel`'s branch query alone; `prepareChainRigConstants` keeps one per chain rig.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The premise that every source passed one holder has the same four rest records is its owner's; the type cannot enforce it.
   */
  export interface ISpan {
    /** Segment-length admission, before the target gate. */
    valid?: boolean;

    /** Hinge and span admission, after a nondegenerate target; null when the hinge cannot change the span. */
    geometry?: IGeometry | null;
  }

  /**
   * The hinge-only span coefficients, independent of target and range.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its term and unit.
   * @evidence contracts/development/design.md#principled-representation The three coefficients of the squared span in metres squared, their amplitude and phase in radians, and the unit hinge they were read about.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Six members, read by `hingedArmSwivel`'s branch roots and branch posing.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A hinge that cannot change the span has no record (`of` returns null) rather than zero coefficients.
   */
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
