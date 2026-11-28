import type { IAutoMovieBicubicAtlasGeometry } from "../model/IAutoMovieBicubicAtlasGeometry";

/**
 * Retained patch and control identities from structural atlas selection.
 *
 * Ordinals address the original model recipe. Admission refuses invalid global
 * tolerance or budgets, and omits patches incident on invalid local
 * coefficients, addresses or bindings. Producer qualifications are reported
 * separately from local omissions.
 */
export namespace IAutoMovieAdmitBicubicAtlas {
  /**
   * The retained occurrences of the model-space recipe. A recognized local
   * refusal omits incident patches and leaves independent retained patches
   * available. Source-fit diagnostics are separate from structural omissions.
   * An empty declared patch array reports an incomplete generated domain.
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
