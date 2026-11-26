/**
 * Existing workspace data completed by
 * {@link AutoMovieTemplateScaffold.renderWorkspace}.
 */
export interface AutoMovieTemplateWorkspaceRequest {
  /** Directory containing the workspace whose catalogs need completion. */
  directory: string;

  /** Current `pnpm-workspace.yaml` contents. */
  source: string;
}
