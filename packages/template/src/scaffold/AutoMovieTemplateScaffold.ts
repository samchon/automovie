import type { IAutoMovieTemplateScaffoldProps } from "./IAutoMovieTemplateScaffoldProps";
import type { IAutoMovieTemplateWorkspaceRequest } from "./IAutoMovieTemplateWorkspaceRequest";
import { assertProjectName as assertProjectNameInternal } from "./internal/assertProjectName";
import { create as createInternal } from "./internal/create";
import { renderWorkspace as renderWorkspaceInternal } from "./internal/renderWorkspace";

/** Prepare the files and workspace settings used by the AutoMovie creator. */
export namespace AutoMovieTemplateScaffold {
  /**
   * Assemble the files for one AutoMovie installation.
   *
   * Standalone productions receive local skills, catalogs and Evidence setup.
   * Workspace roots receive shared skills and member catalogs. Workspace
   * productions receive their project files and read skills from the root.
   *
   * @param props The installation kind and name.
   * @returns UTF-8 text keyed by path relative to the installation. Paths use
   *   forward slashes. The caller writes the files to disk.
   * @throws If the project name is refused, packaged inputs cannot be read, or
   *   two scaffold sources claim the same output path.
   */
  export function create(
    props: IAutoMovieTemplateScaffoldProps,
  ): Record<string, string> {
    return createInternal(props);
  }

  /**
   * Render pnpm settings for a new installation or complete an existing file.
   *
   * A new workspace adds member globs. Both new layouts include catalogs and
   * build policy. For an existing file, add only missing catalog entries.
   * Compatible linked SDK siblings supply missing scoped entries when no
   * override owns them. Return the original text when every entry exists.
   *
   * @param workspace A new layout or the existing YAML and its directory.
   * @returns Workspace YAML. The caller writes any changes.
   * @throws If required package data or a linked manifest cannot be read, or
   *   the existing YAML or a required mapping is invalid.
   */
  export function renderWorkspace(
    workspace: "production" | "workspace" | IAutoMovieTemplateWorkspaceRequest,
  ): string {
    return renderWorkspaceInternal(workspace);
  }

  /**
   * Trim a name and check the scaffold's directory-segment rules.
   *
   * @param name The supplied project or workspace name.
   * @returns The trimmed name.
   * @throws If the trimmed name is empty, is `.` or `..`, ends in a dot,
   *   contains a reserved path character or ASCII control character below
   *   U+0020, or starts with a reserved device name followed by a dot or the
   *   end of the name.
   */
  export function assertProjectName(name: string): string {
    return assertProjectNameInternal(name);
  }
}
