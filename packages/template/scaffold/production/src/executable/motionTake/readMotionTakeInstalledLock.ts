import { access } from "node:fs/promises";
import path from "node:path";

import { hashMotionTakeFile } from "./hashMotionTakeFile";

/**
 * Measure the lockfile at the nearest pnpm workspace boundary, if present.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the workspace boundary and optional result.
 * @evidence contracts/development/implementation.md#principled-implementation Locates the workspace using standard pnpm filenames and hashes its actual lockfile bytes. An artifact cannot choose the lockfile; permission and read errors are not treated as absence.
 * @evidence contracts/development/implementation.md#efficient-algorithms Walks toward the workspace root, then measures the associated lockfile once. Tests one file per directory level and only streams the matching lockfile. Must measure installed inputs again on reopen. Leaves no open handles or retained lockfile contents.
 */
export async function readMotionTakeInstalledLock(
  root: string,
): Promise<string | undefined> {
  for (let directory: string = root; ; directory = path.dirname(directory)) {
    const workspace: boolean = await access(
      path.join(directory, "pnpm-workspace.yaml"),
    ).then(
      (): boolean => true,
      (error: NodeJS.ErrnoException): boolean => {
        if (error.code !== "ENOENT") throw error;
        return false;
      },
    );
    if (workspace)
      return hashMotionTakeFile(path.join(directory, "pnpm-lock.yaml")).catch(
        (error: NodeJS.ErrnoException): undefined => {
          if (error.code !== "ENOENT") throw error;
          return undefined;
        },
      );
    if (directory === path.dirname(directory)) return undefined;
  }
}
