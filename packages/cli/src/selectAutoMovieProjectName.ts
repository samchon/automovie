import * as path from "node:path";

import { deriveAutoMovieProjectName } from "./deriveAutoMovieProjectName";

/**
 * Choose a `create` request's project name, or report that it must be asked for.
 *
 * A typed `name` wins. A target that resolves to the working directory itself, such as `.`, returns `undefined`: its basename was chosen before the user ran the command, so it is not taken as the name and `run` asks instead. Any other target gives {@link deriveAutoMovieProjectName} of its resolved path.
 *
 * @param props The target as typed, the working directory, and the typed name if any.
 * @returns The chosen name, or `undefined` when the name must be asked for.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Both paths are resolved before comparison, so `.`, `./` and the absolute working directory are the same target.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The pure decision is separate from the terminal prompt, so `run` owns the only I/O.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The working directory's own name is never silently adopted; the caller must ask or fall back explicitly.
 * @evidence contracts/development/common.md#meaningful-documentation The comment states the precedence, why the working directory is asked about, and the derivation for other targets.
 * @evidence contracts/development/implementation.md#efficient-algorithms Two path resolutions and one comparison, linear in path length.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call decides one request once.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function returns a string or nothing and retains nothing.
 */
export function selectAutoMovieProjectName(props: {
  /** Target directory as typed. */
  directory: string;

  /** The working directory the target resolves against. */
  cwd: string;

  /** The typed `--name`, if any. */
  name?: string;
}): string | undefined {
  if (props.name !== undefined) return props.name;
  const target: string = path.resolve(props.cwd, props.directory);
  if (target === path.resolve(props.cwd)) return undefined;
  return deriveAutoMovieProjectName(target);
}
