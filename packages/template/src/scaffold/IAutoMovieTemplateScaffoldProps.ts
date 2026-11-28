/** Choose the files and metadata for a new installation. */
export interface IAutoMovieTemplateScaffoldProps {
  /**
   * `production` supplies a standalone project. `workspace` supplies the root
   * and shared catalogs. `workspace-production` supplies one child at
   * `movies/<family>/<name>` that uses the root's skills and catalogs.
   */
  kind: "production" | "workspace" | "workspace-production";

  /** Name substituted as text after the scaffold's name check trims it. */
  name: string;
}
