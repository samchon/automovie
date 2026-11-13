/**
 * What {@link createAutoMovieScaffold} creates.
 *
 * @evidence contracts/development/design.md#principled-representation The record holds only what differs between creations: the installation kind and the name. Dependency versions are fixed when the package is built, so a caller cannot pin a scaffold to ranges the package was not built with.
 * @evidence contracts/development/design.md#minimal-and-owned-surface `kind` selects the layers and generated files, and `name` fills the one per-project token; the name rule lives in `assertScaffoldProjectName`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No override or raw token field lets a caller bypass the name rule or the built versions.
 * @evidence contracts/development/common.md#meaningful-documentation Each member states its effect on the created files.
 */
export interface IAutoMovieScaffoldProps {
  /**
   * The installation created.
   *
   * - `production`: a single production in its own repository, with the shared instructions and a `pnpm-workspace.yaml` holding its dependency catalogs.
   * - `workspace`: a pnpm workspace root for `movies/shorts/*`, `movies/series/*` and `packages/*`, with the shared instructions and the catalogs every production uses.
   * - `workspace-production`: a production inside such a workspace, three levels below the root whose instructions and catalogs it uses.
   */
  kind: "production" | "workspace" | "workspace-production";

  /**
   * The project's or workspace's name, written into its `package.json` and README heading after trimming. `assertScaffoldProjectName` lists the refused names.
   */
  name: string;
}
