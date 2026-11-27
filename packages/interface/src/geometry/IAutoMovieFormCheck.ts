import type { IAutoMovieFormExpectation } from "./IAutoMovieFormExpectation";
import type { IAutoMovieMeshWinding } from "./IAutoMovieMeshWinding";
import type { IAutoMovieModelContact } from "./IAutoMovieModelContact";
import type { IAutoMovieVector3 } from "./IAutoMovieVector3";

/**
 * The result of checking a form against an `IAutoMovieFormExpectation`, as
 * `checkFormExpectation` returns it.
 *
 * A form passes when `findings` holds no entry whose subject is `form` and
 * `loose` is empty. Findings on a mutant are expected: they are what shows the
 * expectation can fail.
 */
export interface IAutoMovieFormCheck {
  /**
   * One entry per failed field, point or pair, for the form and for each
   * mutant, in the order form, box, hull and, within each, in field order.
   */
  findings: IAutoMovieFormCheck.IFinding[];

  /**
   * Each mutant that passes every given shape field and is not listed in the
   * expectation's `matches`, so the expectation cannot tell it from the form.
   */
  loose: IAutoMovieFormExpectation.Mutant[];
}

/** Members of the form check. */
export namespace IAutoMovieFormCheck {
  /** What was measured: the form itself, its box or its hull. */
  export type Subject = "form" | IAutoMovieFormExpectation.Mutant;

  /** One failed expectation, discriminated by the field it failed. */
  export type IFinding =
    | ISizeFinding
    | IPiecesFinding
    | IGeneraFinding
    | IPointFinding
    | IPairFinding;

  /** An extent outside its range. */
  export interface ISizeFinding {
    /** The failed field. */
    field: "size";

    /** What was measured. */
    subject: Subject;

    /** The axis whose extent failed. */
    axis: "x" | "y" | "z";

    /** The measured extent in metres. */
    measured: number;

    /** The expected range in metres. */
    expected: IAutoMovieFormExpectation.Range;
  }

  /** A piece count that differs from the expected one. */
  export interface IPiecesFinding {
    /** The failed field. */
    field: "pieces";

    /** What was measured. */
    subject: Subject;

    /** The measured number of pieces. */
    measured: number;

    /** The expected number of pieces. */
    expected: number;
  }

  /** Piece genera that differ from the expected ones. */
  export interface IGeneraFinding {
    /** The failed field. */
    field: "genera";

    /** What was measured. */
    subject: Subject;

    /**
     * Each piece's genus in ascending order, nulls last, a null standing for a
     * piece that is not a manifold orientable surface.
     */
    measured: (number | null)[];

    /** The expected genera in ascending order. */
    expected: number[];
  }

  /** A point that is not solid, or not empty, as expected. */
  export interface IPointFinding {
    /**
     * The failed field: `solid` points must be inside, `empty` ones neither
     * inside nor on the surface.
     */
    field: "solid" | "empty";

    /** What was measured. */
    subject: Subject;

    /** The point's position in its field's list. */
    index: number;

    /** The point in model metres. */
    point: IAutoMovieVector3;

    /** The winding query's answer at the point. */
    measured: IAutoMovieMeshWinding;
  }

  /** A part pair that does not meet as expected; only the form has pairs. */
  export interface IPairFinding {
    /** The failed field. */
    field: "pairs";

    /** What was measured; always the form. */
    subject: "form";

    /** The expected pair. */
    expected: IAutoMovieFormExpectation.IPair;

    /** The contact report's record for the pair. */
    measured: IAutoMovieModelContact;
  }
}
