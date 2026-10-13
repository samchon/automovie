import type { IAutoMovieWorkspacePackageVersions } from "./IAutoMovieWorkspacePackageVersions";


/**
 * Inputs of {@link resolveAutoMovieTemplateDependencyVersions}, read by the caller before resolution so the resolver itself touches no file.
 *
 * @evidence contracts/common.md#principled-implementation Passing the manifest text and the package ranges as values makes resolution a pure function of its inputs, which is what lets the build script and the test drive the same code with different workspaces.
 * @evidence contracts/common.md#clear-and-simple-design The two fields mirror the two sources of the version table, the pnpm catalogs and the workspace package manifests, and acquiring them stays with the build script.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Neither field has a default, so a resolution can never fall back to a version that was not read from the workspace.
 * @evidence contracts/common.md#meaningful-documentation The comment states that the caller acquires the inputs; the members state which file each comes from and what it must contain.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The record only carries the manifest text and package ranges; parsing and lookup cost belongs to the resolver.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The record is consumed by one resolution; reuse of the parsed manifest happens inside the resolver.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The record holds the whole manifest text and twelve ranges until the resolution returns; it holds no handle.
 * @author Samchon
 */
export interface IAutoMovieTemplateDependencyVersionsProps {
  /**
   * Complete `pnpm-workspace.yaml` text. Its top-level `catalogs` mapping must contain every catalog and dependency the resolver reads.
   */
  workspace: string;


  /** Ranges of the workspace's own packages, copied into the table unchanged. */
  packages: IAutoMovieWorkspacePackageVersions;
}
