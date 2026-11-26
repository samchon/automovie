import type { AutoMovieTemplateScaffoldProps } from "./AutoMovieTemplateScaffoldProps";
import type { AutoMovieTemplateWorkspaceRequest } from "./AutoMovieTemplateWorkspaceRequest";
import { assertProjectName as assertProjectNameInternal } from "./internal/assertProjectName";
import { create as createInternal } from "./internal/create";
import { renderWorkspace as renderWorkspaceInternal } from "./internal/renderWorkspace";

/** Operations for creating AutoMovie production and workspace files. */
export namespace AutoMovieTemplateScaffold {
  /** Create an installation's files as a path-to-content map. */
  export function create(
    props: AutoMovieTemplateScaffoldProps,
  ): Record<string, string> {
    return createInternal(props);
  }

  /** Render workspace settings, or fill missing catalogs in existing YAML. */
  export function renderWorkspace(
    workspace: "production" | "workspace" | AutoMovieTemplateWorkspaceRequest,
  ): string {
    return renderWorkspaceInternal(workspace);
  }

  /** Trim and validate a project name as one portable directory segment. */
  export function assertProjectName(name: string): string {
    return assertProjectNameInternal(name);
  }
}
