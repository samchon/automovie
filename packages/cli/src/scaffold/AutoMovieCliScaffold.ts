import type { IAutoMovieTemplateScaffoldProps } from "@automovie/template";

import type { AutoMovieCommand } from "../AutoMovieCommand";
import type { AutoMovieCliProjectNameSelection } from "./AutoMovieCliProjectNameSelection";
import { AUTOMOVIE_DEFAULT_PROJECT_NAME } from "./internal/AUTOMOVIE_DEFAULT_PROJECT_NAME";
import { deriveAutoMovieProjectName } from "./internal/deriveAutoMovieProjectName";
import { promptAutoMovieProjectName } from "./internal/promptAutoMovieProjectName";
import { readAutoMovieAddArguments } from "./internal/readAutoMovieAddArguments";
import { readAutoMovieCreateArguments } from "./internal/readAutoMovieCreateArguments";
import { renderAutoMovieScaffoldNextSteps } from "./internal/renderAutoMovieScaffoldNextSteps";
import { selectAutoMovieProjectName } from "./internal/selectAutoMovieProjectName";

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
    return deriveAutoMovieProjectName(targetDir);
  }

  /** Admit the arguments following `add`. */
  export function readAddArguments(args: readonly string[]): AutoMovieCommand {
    return readAutoMovieAddArguments(args);
  }

  /** Admit the arguments following `create`. */
  export function readCreateArguments(
    args: readonly string[],
  ): AutoMovieCommand {
    return readAutoMovieCreateArguments(args);
  }

  /** Render the next steps printed after scaffold installation. */
  export function renderNextSteps(
    directory: string,
    kind: IAutoMovieTemplateScaffoldProps["kind"],
  ): string {
    return renderAutoMovieScaffoldNextSteps(directory, kind);
  }

  /** Ask for a project name when the create target is the current directory. */
  export function promptProjectName(): Promise<string> {
    return promptAutoMovieProjectName();
  }

  /**
   * Choose a typed or derived name, or return `undefined` when prompting is
   * needed.
   */
  export function selectProjectName(
    props: AutoMovieCliProjectNameSelection,
  ): string | undefined {
    return selectAutoMovieProjectName(props);
  }
}
