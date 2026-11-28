import type { IAutoMovieConstructionProfile } from "./IAutoMovieConstructionProfile";

/**
 * Source identities needed to adapt a native view part into an original
 * profile.
 */
export namespace IAutoMovieConstructionNativeProfile {
  /**
   * Nonempty material, binding and revision identities supplied when adapting a
   * direct native view part to an original profile. Rebuild the source when one
   * of those dependencies changes.
   */
  export type IIdentity = {
    /** Material owner address assigned to the native profile's region. */
    material: string;

    /** Binding owner address assigned to the native profile's region. */
    binding: string;

    /**
     * Source, constraint and topology revision identities copied into the
     * returned definition.
     */
    revisions: IAutoMovieConstructionProfile["revisions"];
  };
}
