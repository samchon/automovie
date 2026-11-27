import type { IAutoMovieViewPart } from "../construction/IAutoMovieViewPart";
import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieHumanMassSource } from "./IAutoMovieHumanMassSource";
import type { IAutoMovieHumanGlutealParent } from "./IAutoMovieHumanGlutealParent";

/**
 * Original trunk and breast dimensions with the admitted parent source and
 * numerical root-support metadata. Runtime construction and admission remain
 * with AutoMovieHumanBreastConnection in Human.
 */
export namespace IAutoMovieHumanBreastConnection {
  /** Same generating trunk and the mass's independent sourced dimensions. */
  export interface IInput {
    /** Actual current tape-pass original trunk. */
    trunk: IAutoMovieViewPart;
    /** Public AP apex in calibration mm. */
    target: AutoMovieVector3Tuple;
    /** Own up/lateral/down/medial footprint, mm. */
    footprint: [number, number, number, number];
    /** Own conic fullness, dimensionless. */
    shoulder: number;
    /** Anatomical lateral direction's world-Z sign. */
    lateral: 1 | -1;
  }

  /**
   * Parent source and numerical root support remain inspectable; this is not a
   * continuous containment certificate.
   */
  export interface IConnection extends IAutoMovieHumanMassSource.IConnection {
    /** Identical actual source and its whole local chord reader. */
    parent: IAutoMovieHumanGlutealParent.IParent;
    /** Finite phase-refinement count, independent of render detail. */
    phases: number;
  }
}
