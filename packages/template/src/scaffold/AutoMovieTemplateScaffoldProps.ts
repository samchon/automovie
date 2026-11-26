/** Inputs accepted by {@link AutoMovieTemplateScaffold.create}. */
export interface AutoMovieTemplateScaffoldProps {
  /**
   * The installation created. `production` creates a single project,
   * `workspace` creates a shared pnpm workspace, and `workspace-production`
   * adds a project inside such a workspace.
   */
  kind: "production" | "workspace" | "workspace-production";

  /** The project's or workspace's name, written after trimming. */
  name: string;
}
