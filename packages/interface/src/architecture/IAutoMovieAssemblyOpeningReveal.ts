import type { IAutoMovieResolvedAssembly } from "./IAutoMovieResolvedAssembly";

/**
 * Structural opening dimensions and resolved lining layers for
 * assemblyOpeningReveal.
 */
export namespace IAutoMovieAssemblyOpeningReveal {
  /**
   * Structural opening dimensions and resolved lining layers for
   * assemblyOpeningReveal.
   *
   * An opening is cut at a structural size and used at a finished one. Every
   * layer that continues around the jamb lines both sides of the opening, so
   * the clear width loses twice the wrapping thickness and the clear height the
   * same; the depth each lining reaches is the run of wrapping layers measured
   * inward from that face, and whatever the two linings do not reach is bare
   * jamb.
   *
   * A lining that consumes the opening is refused rather than reported as a
   * negative clear dimension. Testing "not above zero" also refuses a computed
   * `NaN`. The resolved assembly is assumed to carry finite nonnegative
   * thicknesses, including zero-thickness membranes; arbitrary forged
   * negative-infinite layers are outside that premise.
   *
   * Only wrapping layers reachable from a face line the jamb. A layer that
   * claims to wrap from behind one that stops there cannot turn the corner,
   * which is why validation refuses it; measuring the runs rather than the
   * flags means it also cannot narrow an opening here if one ever reaches this
   * function unvalidated. When every layer wraps, the whole build-up is the
   * first face's run and the last face's run is empty.
   *
   * Throws when either structural dimension is not a finite number above zero,
   * and when the lining leaves no positive clear width or height.
   */
  export type IProps = {
    /**
     * Borrowed admitted layer order and thicknesses in metres; only
     * face-accessible wrapping runs line the opening.
     */
    resolved: IAutoMovieResolvedAssembly;

    /** Structural opening width in metres before lining, strictly above zero. */
    width: number;

    /** Structural opening height in metres before lining, strictly above zero. */
    height: number;
  };
}
