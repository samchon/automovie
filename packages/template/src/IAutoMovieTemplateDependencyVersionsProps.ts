import type { IAutoMovieWorkspacePackageVersions } from "./IAutoMovieWorkspacePackageVersions";

/**
 * Inputs of {@link resolveAutoMovieTemplateDependencyVersions}, read by the caller before resolution so the resolver itself touches no file.
 *
 * @evidence contracts/development/design.md#principled-representation Passing the manifest text and the package ranges as values makes resolution a pure function of its inputs, which is what lets the build script and the test drive the same code with different workspaces.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The two fields mirror the two sources of the version table, the pnpm catalogs and the workspace package manifests, and acquiring them stays with the build script.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Neither field has a default, so a resolution can never fall back to a version that was not read from the workspace.
 * @evidence contracts/development/common.md#meaningful-documentation The comment states that the caller acquires the inputs; the members state which file each comes from and what it must contain.
 */
export interface IAutoMovieTemplateDependencyVersionsProps {
  /**
   * Complete `pnpm-workspace.yaml` text. Its top-level `catalogs` mapping must contain every catalog and dependency the resolver reads.
   */
  workspace: string;

  /** Ranges of the workspace's own packages, copied into the table unchanged. */
  packages: IAutoMovieWorkspacePackageVersions;
}
