import type { IAutoMovieConstructionProfile } from "./IAutoMovieConstructionProfile";

/**
 * Source identities needed to adapt a native view part into an original
 * profile.
 */
export namespace IAutoMovieConstructionNativeProfile {
  /**
   * Nonempty owner addresses accompanying one native profile preparation.
   * NativeProfile rejects falsy material, binding or revision strings and
   * copies revisions into the returned pure definition. The caller changes
   * revision tokens and prepares again when the original dependencies change.
   */
  export type IIdentity = {
    /** Original material owner address published on the native profile's region. */
    material: string;

    /** Original binding owner address published alongside that material. */
    binding: string;

    /**
     * Source, constraint and topology revision tokens copied into the new
     * definition.
     */
    revisions: IAutoMovieConstructionProfile["revisions"];
  };
}
