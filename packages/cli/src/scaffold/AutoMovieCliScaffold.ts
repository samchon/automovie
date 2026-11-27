import type { IAutoMovieTemplateScaffoldProps } from "@automovie/template";

import type { AutoMovieCommand } from "../command/AutoMovieCommand";
import type { IAutoMovieCliProjectNameSelection } from "./IAutoMovieCliProjectNameSelection";
import { AUTOMOVIE_DEFAULT_PROJECT_NAME } from "./internal/AUTOMOVIE_DEFAULT_PROJECT_NAME";
import { deriveProjectNameImplementation } from "./internal/deriveProjectNameImplementation";
import { promptProjectNameImplementation } from "./internal/promptProjectNameImplementation";
import { readAddArgumentsImplementation } from "./internal/readAddArgumentsImplementation";
import { readCreateArgumentsImplementation } from "./internal/readCreateArgumentsImplementation";
import { renderScaffoldNextSteps } from "./internal/renderScaffoldNextSteps";
import { selectProjectNameImplementation } from "./internal/selectProjectNameImplementation";

/**
 * Public APIs for admitting create/add requests and naming and guiding a new
 * AutoMovie scaffold.
 *
 * The CLI uses this non-callable namespace to keep scaffold setup behavior
 * together while command dispatch and production commands remain separate.
 */
export namespace AutoMovieCliScaffold {
  /** The project name offered and used when no name can be derived. */
  export const DEFAULT_PROJECT_NAME: string = AUTOMOVIE_DEFAULT_PROJECT_NAME;

  /** Derive a package-safe project name from a target directory. */
  export function deriveProjectName(targetDir: string): string {
    return deriveProjectNameImplementation(targetDir);
  }

  /** Admit the arguments following `add`. */
  export function readAddArguments(args: readonly string[]): AutoMovieCommand {
    return readAddArgumentsImplementation(args);
  }

  /** Admit the arguments following `create`. */
  export function readCreateArguments(
    args: readonly string[],
  ): AutoMovieCommand {
    return readCreateArgumentsImplementation(args);
  }

  /** Render the next steps printed after scaffold installation. */
  export function renderNextSteps(
    directory: string,
    kind: IAutoMovieTemplateScaffoldProps["kind"],
  ): string {
    return renderScaffoldNextSteps(directory, kind);
  }

  /** Ask for a project name when the create target is the current directory. */
  export function promptProjectName(): Promise<string> {
    return promptProjectNameImplementation();
  }

  /**
   * Choose a typed or derived name, or return `undefined` when prompting is
   * needed.
   */
  export function selectProjectName(
    props: IAutoMovieCliProjectNameSelection,
  ): string | undefined {
    return selectProjectNameImplementation(props);
  }
}
