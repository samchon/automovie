/** The settings text and path context used to complete existing pnpm catalogs. */
export interface IAutoMovieTemplateWorkspaceRequest {
  /** Directory against which relative links in the YAML resolve. */
  directory: string;

  /** Contents of the current `pnpm-workspace.yaml` file. */
  source: string;
}
