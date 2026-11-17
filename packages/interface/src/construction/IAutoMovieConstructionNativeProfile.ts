import type { IAutoMovieConstructionProfile } from "./IAutoMovieConstructionProfile";

/**
 * Source identities needed to adapt a native view part into an original profile.
 *
 * @evidence contracts/development/design.md#principled-representation Separates material/binding addresses and revision tokens from the native part's geometry.
 * @evidence contracts/development/design.md#minimal-and-owned-surface NativeProfile reads these identities to publish its region and dependency declaration.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Tokens identify owners; matching strings do not prove geometric or binding equivalence.
 * @evidence contracts/development/common.md#meaningful-documentation States identity purpose and the adapter's presence admission.
 */
export namespace IAutoMovieConstructionNativeProfile {
  /**
   * Nonempty owner addresses accompanying one native profile preparation.
   * NativeProfile rejects falsy material, binding or revision strings and copies
   * revisions into the returned pure definition. The caller changes revision
   * tokens and prepares again when the original dependencies change.
   *
   * @evidence contracts/development/design.md#principled-representation Uses the profile's existing revision object and dimensionless opaque owner addresses.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The adapter writes material and binding into its single region and revisions into its definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Presence admission does not resolve these strings to external assets or validate revision history.
   * @evidence contracts/development/common.md#meaningful-documentation States nonempty admission, copy behavior and dependency-change responsibility.
   */
  export type IIdentity = {
    /** Original material owner address published on the native profile's region. */
    material: string;

    /** Original binding owner address published alongside that material. */
    binding: string;

    /** Source, constraint and topology revision tokens copied into the new definition. */
    revisions: IAutoMovieConstructionProfile["revisions"];
  };
}
