import { execFileSync } from "node:child_process";
import { ISourceRevision } from "./ISourceRevision";
import { productionRoot } from "./productionRoot";

/** Returns null when Git is unreadable, without inventing a value. */

export const sourceRevision = (): ISourceRevision | null => {
  try {
    const git = (...args: string[]) => execFileSync("git", args, { cwd: productionRoot, encoding: "utf8", windowsHide: true }).trim();
    return {
      commit: git("log", "-1", "--format=%H", "--", "."),
      dirty: git("status", "--porcelain", "--", ".").length > 0,
    };
  } catch {
    return null;
  }
};
