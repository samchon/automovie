import type { IAutoMovieBicubicAtlasGeometry } from "../model/IAutoMovieBicubicAtlasGeometry";

/**
 * Structural selection from a bicubic atlas before tessellation.
 *
 * Patch and control integers index the original recipe; they do not renumber
 * coefficients or certify geometric quality. Global identity and budgets throw
 * on invalid input; malformed local coefficients or bindings omit incident
 * patches while independent finite patches survive.
 */
export namespace IAutoMovieAdmitBicubicAtlas {
  /**
   * The structurally usable occurrences of an admitted global atlas recipe.
   * Invalid coefficient or canonical-boundary declarations omit only incident
   * patches and retain exact diagnostics; valid independent patches remain
   * available for display. Producer source-fit qualifications are retained as
   * diagnostics independently of structural completeness and never suppress
   * finite usable patches. An empty declared patch array is an explicit
   * incomplete generated domain.
   */
  export type IResult = {
    /**
     * New mutable list of admitted original patch ordinals, in declaration
     * order; empty when none survives.
     */
    patches: number[];

    /**
     * Sorted unique original coefficient ordinals referenced by retained
     * patches or their used boundary authorities; no coefficient values are
     * copied here.
     */
    controls: number[];

    /**
     * New ordered diagnostic messages for structural omissions and source-fit
     * qualifications; an empty list does not certify shape quality.
     */
    diagnostics: string[];

    /**
     * Used admitted canonical authorities; the list is new but its declaration
     * objects and controlIds arrays are borrowed from the input.
     */
    boundaryAuthorities: NonNullable<
      IAutoMovieBicubicAtlasGeometry["boundaryAuthorities"]
    >;

    /**
     * Admitted bindings incident to retained patches; the list is new but its
     * binding objects are borrowed. Absent input bindings yield an empty list.
     */
    boundaryBindings: NonNullable<
      IAutoMovieBicubicAtlasGeometry["boundaryBindings"]
    >;
  };
}
