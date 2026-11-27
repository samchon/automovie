import type { IAutoMovieModelContact } from "./IAutoMovieModelContact";
import type { IAutoMovieVector3 } from "./IAutoMovieVector3";

/**
 * What a form must be, written before it is measured and checked by
 * `checkFormExpectation`.
 *
 * The record is an inspection contract for modelling and tests, not a
 * screenplay or authoring axis. Every field is optional; a field left out is
 * not checked. The first five fields describe the form's shape and are also run
 * against two mutants of the form, its axis-aligned box and its convex hull,
 * which a useful expectation must reject; `matches` names the mutants the form
 * is expected to equal, as a convex form equals its hull. Points and distances
 * are in the model frame, in metres, after every part is placed.
 */
export interface IAutoMovieFormExpectation {
  /**
   * The axis-aligned extent of the placed parts on each axis, as a `[minimum,
   * maximum]` range in metres; an axis left out is not checked.
   */
  size?: IAutoMovieFormExpectation.ISize;

  /**
   * The exact number of pieces `measureMeshPieces` reports for the
   * placed parts merged into one mesh.
   */
  pieces?: number;

  /**
   * The genus of each of those pieces, in ascending order. A piece whose genus
   * is null, because it is not a manifold orientable surface, fails it.
   */
  genera?: number[];

  /** Points that must be inside the form by its winding number. */
  solid?: IAutoMovieVector3[];

  /** Points that must be neither inside the form nor on its surface. */
  empty?: IAutoMovieVector3[];

  /**
   * How named part pairs must meet, as `measureModelContacts` reports
   * them. Pairs are never run against a mutant, which has one part.
   */
  pairs?: IAutoMovieFormExpectation.IPair[];

  /**
   * The contact distance in metres passed to `measureModelContacts`;
   * required when `pairs` is given.
   */
  contact?: number;

  /**
   * The mutants this form is expected to satisfy. A mutant that passes every
   * given shape field and is not listed here makes the expectation too loose.
   */
  matches?: IAutoMovieFormExpectation.Mutant[];
}

/** Members of the form expectation. */
export namespace IAutoMovieFormExpectation {
  /** A stand-in the expectation must tell from the form: its box or its hull. */
  export type Mutant = "box" | "hull";

  /** An inclusive minimum and maximum in metres. */
  export interface Range {
    /** Minimum allowed value, inclusive. */
    min: number;

    /** Maximum allowed value, inclusive. */
    max: number;
  }

  /** Extent ranges for the axes that are checked. */
  export interface ISize {
    /** Range for the extent along X, in metres. */
    x?: Range;

    /** Range for the extent along Y, in metres. */
    y?: Range;

    /** Range for the extent along Z, in metres. */
    z?: Range;
  }

  /** How one pair of parts must meet. */
  export interface IPair {
    /** One part's identity. */
    part: string;

    /** The other part's identity; the order of the two does not matter. */
    other: string;

    /** The relation the contact report must give the pair. */
    relation: IAutoMovieModelContact.Relation;

    /** The range the pair's gap must fall in, in metres, when given. */
    gap?: Range;
  }
}
