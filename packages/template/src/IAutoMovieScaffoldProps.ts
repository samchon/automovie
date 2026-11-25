/** What {@link createAutoMovieScaffold} creates. */
export interface IAutoMovieScaffoldProps {
  /**
   * The installation created.
   *
   * - `production`: a single production in its own repository, with the shared
   *   instructions and a `pnpm-workspace.yaml` holding its dependency
   *   catalogs.
   * - `workspace`: a pnpm workspace root for `movies/shorts/*`, `movies/series/*`
   *   and `packages/*`, with the shared instructions and the catalogs every
   *   production uses.
   * - `workspace-production`: a production inside such a workspace, three levels
   *   below the root whose instructions and catalogs it uses.
   */
  kind: "production" | "workspace" | "workspace-production";

  /**
   * The project's or workspace's name, written into its `package.json` and
   * README heading after trimming. `assertScaffoldProjectName` lists the
   * refused names.
   */
  name: string;
}
