/**
 * `a + b cos ψ + c sin ψ` of a swivel `ψ`. An interval of swivels, degrees,
 * `from` up to `to`.
 */
export namespace IAutoMovieSwivelArcs {
  /** `a + b cos ψ + c sin ψ` of a swivel `ψ`. */
  export interface ISinusoid {
    /** The constant term. */
    a: number;

    /** The cosine's coefficient. */
    b: number;

    /** The sine's coefficient. */
    c: number;
  }

  /** An interval of swivels, degrees, `from` up to `to`. */
  export interface IArc {
    /** The start, degrees. */
    from: number;

    /** The end, degrees, not before `from`. */
    to: number;
  }
}
