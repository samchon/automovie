import type { IAutoMovieWorkspacePackageVersions } from "./IAutoMovieWorkspacePackageVersions";

/**
 * Immutable acquisition inputs for scaffold dependency resolution.
 *
 * @evidence requirements/agent-authoring/project-ownership.md#agent-portable-authoring Makes the complete portable library and toolchain inputs explicit.
 * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-input Separates filesystem acquisition from catalog interpretation.
 * @author Samchon
 */
export interface IAutoMovieTemplateDependencyVersionsProps {
  /**
   * Complete workspace manifest text containing the named pnpm catalogs.
   *
   * @evidence requirements/agent-authoring/project-ownership.md#agent-portable-authoring Carries the workspace input used to install the portable authoring dependencies.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-input Makes workspace an explicit dependency-resolution input instead of host state.
   */
  workspace: string;

  /**
   * Acquired workspace library version ranges.
   *
   * @evidence requirements/agent-authoring/project-ownership.md#agent-portable-authoring Carries the packages input used to install the portable authoring dependencies.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-input Makes packages an explicit dependency-resolution input instead of host state.
   */
  packages: IAutoMovieWorkspacePackageVersions;
}
