import type { IAutoMovieWorkspacePackageVersions } from "./IAutoMovieWorkspacePackageVersions";

/**
 * Immutable acquisition inputs for scaffold dependency resolution.
 *
 * @author Samchon
 */
export interface IAutoMovieTemplateDependencyVersionsProps {
  /** Complete workspace manifest text containing the named pnpm catalogs. */
  workspace: string;

  /** Acquired workspace library version ranges. */
  packages: IAutoMovieWorkspacePackageVersions;
}
