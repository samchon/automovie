import * as fs from "node:fs";
import * as path from "node:path";

import type { IAutoMoviePackageManager } from "./IAutoMoviePackageManager";

/**
 * Choose the package manager a freshly created single production is installed with, for its next-step text.
 *
 * The nearest `pnpm-workspace.yaml` at the target or one of its ancestors wins and is returned as `workspace`, because a production inside a pnpm workspace installs once with `pnpm install` at that root, as the production README states. Otherwise a `pnpm-lock.yaml` or `package-lock.json` already in the target decides, then a `pnpm/` prefix of `userAgent` (`npm_config_user_agent`, set by the invoking package manager); npm is the default the production README documents.
 *
 * @param props The absolute target directory and the invoking user agent, if any.
 * @returns The manager, with the workspace root when one encloses the target.
 *
 * @evidence contracts/development/implementation.md#principled-implementation The enclosing workspace outranks how the CLI was launched, because `npx automovie create` inside a pnpm monorepo still lands in pnpm's install graph; a lockfile in the target outranks the launcher for the same reason.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One decision separate from the text rendering, with the environment passed in so `run` owns the process read.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Only pnpm and npm are named, the two managers the scaffold documents; yarn, bun or an unknown agent fall back to the documented npm steps instead of guessed commands.
 * @evidence contracts/development/common.md#meaningful-documentation The comment states the precedence, why the workspace wins, and the default.
 * @evidence contracts/development/implementation.md#efficient-algorithms One existence check per ancestor, linear in path depth, plus two in the target.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work `run` calls this once per successful creation.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Existence checks hold no handle and the result retains nothing.
 */
export function selectAutoMoviePackageManager(props: {
  /** Absolute target directory. */
  directory: string;

  /** The invoking `npm_config_user_agent`, if any. */
  userAgent?: string;
}): IAutoMoviePackageManager {
  for (
    let current: string = path.resolve(props.directory);
    ;
    current = path.dirname(current)
  ) {
    if (fs.existsSync(path.join(current, "pnpm-workspace.yaml")))
      return { manager: "pnpm", workspace: current };
    if (path.dirname(current) === current) break;
  }
  if (fs.existsSync(path.join(props.directory, "pnpm-lock.yaml")))
    return { manager: "pnpm" };
  if (fs.existsSync(path.join(props.directory, "package-lock.json")))
    return { manager: "npm" };
  return {
    manager: props.userAgent?.startsWith("pnpm/") === true ? "pnpm" : "npm",
  };
}
