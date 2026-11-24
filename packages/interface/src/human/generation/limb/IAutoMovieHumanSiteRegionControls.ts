import type { IAutoMovieHumanSectionSource } from "./IAutoMovieHumanSectionSource";
import type { IAutoMovieHumanSiteControls } from "./IAutoMovieHumanSiteControls";

/**
 * Shared local constraints with explicit host connection and whole-host
 * preparation requests. Runtime construction and admission remain with
 * AutoMovieHumanSiteRegionControls in Human.
 */
export namespace IAutoMovieHumanSiteRegionControls {
  /** Both source consumers share one set of independent tape constraints. */
  export interface IOutput {
    /**
     * Actual local scalar controls and site diagnostics, without any proximal
     * constraint.
     */
    local: IAutoMovieHumanSiteControls.IOutput;

    /**
     * Admitted field of the same local scalar declaration, or null after failed
     * controls.
     */
    field: IAutoMovieHumanSiteControls.IField | null;

    /**
     * Supply the same complete local scalar boundary and qualified jets to the
     * host input.
     */
    connect(input: IAutoMovieHumanSectionSource): IAutoMovieHumanSectionSource;

    /**
     * Explicit whole-host scalar demand; local sites are reused only for
     * identical numeric tuples.
     */
    prepare(
      input: IAutoMovieHumanSectionSource,
    ): IAutoMovieHumanSiteControls.IOutput;
  }
}
