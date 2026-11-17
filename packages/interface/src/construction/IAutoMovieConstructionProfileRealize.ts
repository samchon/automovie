import type { IAutoMovieConstructionProfile } from "./IAutoMovieConstructionProfile";

/**
 * Profile leaf selected by the construction walk for source-backed realization.
 *
 * @evidence contracts/development/design.md#principled-representation Adds the profile discriminator to the existing pure source declaration, retaining its metre station domains.
 * @evidence contracts/development/design.md#minimal-and-owned-surface ConstructionProfileRealize resolves this declaration against the invocation's source map by name.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Source presence and structural agreement require runtime checks; the discriminator alone supplies no functions.
 * @evidence contracts/development/common.md#meaningful-documentation Names source resolution and its declaration-versus-function distinction.
 */
export namespace IAutoMovieConstructionProfileRealize {
  /**
   * Resolve one pure profile leaf to its actual invocation-owned original family.
   *
   * A detached declaration is compared structurally without property-order or
   * object-identity assumptions. Actual curve/frame functions then prepare the
   * retained atlas, physical2 grids and shared mesh boundaries once. Initial
   * source/preparation failures become a named leaf diagnostic, matching source
   * leaf admission; appended body/list changes roll back to the same checkpoint.
   * Exceptions from later retained readers keep their existing operator policy.
   *
   * @evidence contracts/development/design.md#principled-representation The literal profile tag selects original profile realization and reuses the closed declaration's units and addresses.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The realization removes only the tag before comparing with the registered source definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Initial source/preparation exceptions are converted to a profile-source diagnostic after append rollback; later retained callbacks are not covered by that catch.
   * @evidence contracts/development/common.md#meaningful-documentation Documents structural matching, source ownership and failure scope.
   */
  export type INode = IAutoMovieConstructionProfile & {
    /** Selects the profile-source leaf handler in the construction walk. */
    type: "profile";
  };
}
