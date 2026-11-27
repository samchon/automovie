import * as path from "node:path";

import type { AutoMovieCliProjectNameSelection } from "../AutoMovieCliProjectNameSelection";
import { deriveAutoMovieProjectName } from "./deriveAutoMovieProjectName";

/*
 * Choose a `create` request's project name, or report that it must be asked
 * for.
 *
 * A typed `name` wins. A target that resolves to the working directory itself,
 * such as `.`, returns `undefined`: its basename was chosen before the user ran
 * the command, so it is not taken as the name and `run` asks instead. Any other
 * target gives deriveAutoMovieProjectName of its resolved path.
 * Parameter props: The target as typed, the working directory, and the typed name
 * if any.
 * Returns: The chosen name, or `undefined` when the name must be asked for.
 */
export function selectAutoMovieProjectName(
  props: AutoMovieCliProjectNameSelection,
): string | undefined {
  if (props.name !== undefined) return props.name;
  const target: string = path.resolve(props.cwd, props.directory);
  if (target === path.resolve(props.cwd)) return undefined;
  return deriveAutoMovieProjectName(target);
}
